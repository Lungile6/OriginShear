import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

/**
 * Fetches farmer lots from the API (subgraph-backed).
 */
export function useFarmerLots(farmerAddress) {
  const [lots, setLots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLots = useCallback(async () => {
    if (!farmerAddress) {
      setLots([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/farmers/${farmerAddress}/lots?page=1&limit=200`, {
        auth: true,
      });
      const mapped = (response.data || []).map((lot) => ({
        lotId: BigInt(lot.lotId || "0"),
        farmer: lot.farmer?.wallet || lot.farmer?.id || "",
        fibreType: Number(lot.fibreType ?? 0),
        grade: Number(lot.grade ?? 0),
        weightGrams: BigInt(lot.weightGrams || "0"),
        gpsZone: lot.gpsZone || "",
        seasonYear: lot.seasonYear || "",
        proofOfOrigin: lot.proofOfOrigin || "",
        status: Number(lot.status ?? 0),
        registeredAt: BigInt(lot.registeredAt || "0"),
        validatedAt: lot.validatedAt ? BigInt(lot.validatedAt) : 0n,
        validatedBy: lot.validatedBy || "0x0000000000000000000000000000000000000000",
        metadataURI: lot.metadataURI || "",
      }));
      setLots(mapped.sort((a, b) => Number(b.lotId) - Number(a.lotId)));
    } catch (err) {
      console.error("Error loading farmer lots from API:", err);
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmerAddress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLots();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLots]);

  return {
    lots,
    isLoading,
    refetch: fetchLots,
  };
}
