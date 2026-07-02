import { useEffect, useState, useCallback } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { FARMER_MARKET_ABI, OfferStatus } from "../contracts/FarmerMarket";
import { HARVEST_LEDGER_ABI } from "../contracts/HarvestLedger";
import { getContractAddresses } from "../contracts/addresses";

/**
 * Reads LotListed events from FarmerMarket, filters to LISTED offers,
 * and enriches each with HarvestLedger lot metadata for buyer browsing.
 */
export function useMarketListings() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const publicClient = usePublicClient();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!publicClient || !addresses?.farmerMarket || !addresses?.harvestLedger) return;

    setIsLoading(true);
    try {
      const logs = await publicClient.getContractEvents({
        address: addresses.farmerMarket,
        abi: FARMER_MARKET_ABI,
        eventName: "LotListed",
        fromBlock: "earliest",
      });

      const offerIds = [...new Set(logs.map((log) => log.args.offerId))];

      const enriched = await Promise.all(
        offerIds.map(async (offerId) => {
          try {
            const offerResult = await publicClient.readContract({
              address: addresses.farmerMarket,
              abi: FARMER_MARKET_ABI,
              functionName: "offers",
              args: [offerId],
            });

            const lotId = offerResult[1];
            const status = offerResult[6];
            if (status !== OfferStatus.LISTED) return null;

            const lot = await publicClient.readContract({
              address: addresses.harvestLedger,
              abi: HARVEST_LEDGER_ABI,
              functionName: "getLot",
              args: [lotId],
            });

            return {
              offerId,
              lotId,
              farmer: offerResult[2],
              askPriceWei: offerResult[3],
              listedAt: offerResult[7],
              fibreType: lot.fibreType,
              grade: lot.grade,
              weightGrams: lot.weightGrams,
              gpsZone: lot.gpsZone,
              seasonYear: lot.seasonYear,
              proofOfOrigin: lot.proofOfOrigin,
            };
          } catch (err) {
            console.error(`Error loading listing for offer ${offerId}:`, err);
            return null;
          }
        })
      );

      const valid = enriched
        .filter(Boolean)
        .sort((a, b) => Number(b.listedAt || 0n) - Number(a.listedAt || 0n));

      setListings(valid);
    } catch (err) {
      console.error("Error reading market listings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, addresses]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, isLoading, refetch: fetchListings };
}
