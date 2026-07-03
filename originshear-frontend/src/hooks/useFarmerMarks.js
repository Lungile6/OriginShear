import { useEffect, useState, useCallback } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { isAddress } from "viem";
import { INDUSTRY_MARK_REGISTRY_ABI } from "../contracts/IndustryMarkRegistry";
import { getContractAddresses } from "../contracts/addresses";

/**
 * Enumerates on-chain industry marks for a single farmer wallet
 * via IndustryMarkRegistry.getFarmerMarks(address).
 */
export function useFarmerMarks(farmerAddress) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const publicClient = usePublicClient();
  const [marks, setMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMarks = useCallback(async () => {
    if (!publicClient || !addresses?.industryMarkRegistry || !farmerAddress || !isAddress(farmerAddress)) {
      setMarks([]);
      return;
    }

    setIsLoading(true);
    try {
      const markIds = await publicClient.readContract({
        address: addresses.industryMarkRegistry,
        abi: INDUSTRY_MARK_REGISTRY_ABI,
        functionName: "getFarmerMarks",
        args: [farmerAddress],
      });

      const detailedMarks = await Promise.all(
        markIds.map(async (id) => {
          try {
            const markResult = await publicClient.readContract({
              address: addresses.industryMarkRegistry,
              abi: INDUSTRY_MARK_REGISTRY_ABI,
              functionName: "getMark",
              args: [id],
            });
            return {
              markId: markResult[0],
              farmer: markResult[1],
              farmerId: markResult[2],
              markType: markResult[3],
              description: markResult[4],
              issuedAt: markResult[5],
              expiresAt: markResult[6],
              status: markResult[7],
              issuedBy: markResult[8],
              metadataURI: markResult[9],
            };
          } catch (err) {
            console.error(`Error reading mark detail for ID ${id}:`, err);
            return null;
          }
        })
      );

      setMarks(
        detailedMarks
          .filter((m) => m !== null)
          .sort((a, b) => Number(b.markId) - Number(a.markId))
      );
    } catch (err) {
      console.error("Error reading farmer marks:", err);
      setMarks([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, addresses, farmerAddress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMarks();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMarks]);

  return { marks, isLoading, refetch: fetchMarks };
}
