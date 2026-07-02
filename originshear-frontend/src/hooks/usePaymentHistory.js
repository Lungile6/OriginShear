import { useEffect, useState } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { FARMER_MARKET_ABI } from "../contracts/FarmerMarket";
import { getContractAddresses } from "../contracts/addresses";

/**
 * Hook to retrieve on-chain payment history by reading PaymentReleased logs
 * from the FarmerMarket contract, then augmenting them with offer details (buyer, lotId).
 * Works for both Farmers (viewing earnings) and Buyers (viewing purchases).
 */
export function usePaymentHistory(userAddress) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const publicClient = usePublicClient();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient || !addresses?.farmerMarket || !userAddress) return;

    let active = true;
    setIsLoading(true);

    async function fetchLogs() {
      try {
        const logs = await publicClient.getContractEvents({
          address: addresses.farmerMarket,
          abi: FARMER_MARKET_ABI,
          eventName: "PaymentReleased",
          fromBlock: "earliest",
        });

        const mapped = logs.map((log) => ({
          offerId: log.args.offerId,
          farmer: log.args.farmer,
          netAmount: log.args.netAmount,
          fee: log.args.fee,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
        }));

        // Query details for each offer to check who the buyer was
        const detailedPayments = await Promise.all(
          mapped.map(async (p) => {
            try {
              const offerResult = await publicClient.readContract({
                address: addresses.farmerMarket,
                abi: FARMER_MARKET_ABI,
                functionName: "offers",
                args: [p.offerId],
              });
              return {
                ...p,
                lotId: offerResult[1],
                askPriceWei: offerResult[3],
                buyer: offerResult[4],
              };
            } catch (err) {
              console.error(`Error fetching offer details for ID ${p.offerId}:`, err);
              return {
                ...p,
                lotId: 0n,
                askPriceWei: 0n,
                buyer: "",
              };
            }
          })
        );

        const filtered = detailedPayments.filter(
          (p) =>
            p.farmer?.toLowerCase() === userAddress.toLowerCase() ||
            p.buyer?.toLowerCase() === userAddress.toLowerCase()
        );

        // Sort newest first
        filtered.sort((a, b) => Number(b.blockNumber || 0n) - Number(a.blockNumber || 0n));

        if (active) {
          setPayments(filtered);
        }
      } catch (err) {
        console.error("Error reading PaymentReleased event logs:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchLogs();

    return () => {
      active = false;
    };
  }, [publicClient, addresses, userAddress]);

  return { payments, isLoading };
}
