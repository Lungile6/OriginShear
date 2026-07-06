import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/apiClient";

/**
 * Loads LISTED market offers from the API (subgraph-backed).
 * Public read — no wallet required for browsing.
 */
export function useMarketListings() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/market/offers?page=1&limit=100&status=LISTED");
      const mapped = (response.data || []).map((offer) => ({
        offerId: BigInt(offer.offerId),
        lotId: BigInt(offer.lot?.lotId || 0),
        farmer: offer.farmer?.wallet || offer.farmer?.id || "",
        askPriceWei: BigInt(offer.askPriceWei || "0"),
        listedAt: BigInt(offer.listedAt || "0"),
        fibreType: Number(offer.lot?.fibreType ?? 0),
        grade: Number(offer.lot?.grade ?? 0),
        weightGrams: BigInt(offer.lot?.weightGrams || "0"),
        gpsZone: offer.lot?.gpsZone || "",
        seasonYear: offer.lot?.seasonYear || "",
        proofOfOrigin: offer.lot?.proofOfOrigin || "",
      }));
      setListings(mapped);
    } catch (err) {
      setError(err?.message || "Failed to load marketplace listings");
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchListings();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  return { listings, isLoading, error, refetch: fetchListings };
}
