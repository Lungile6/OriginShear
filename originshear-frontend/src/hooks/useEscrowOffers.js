import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

function mapOffer(offer) {
  return {
    offerId: BigInt(offer.offerId),
    lotId: BigInt(offer.lot?.lotId || 0),
    farmer: offer.farmer?.wallet || offer.farmer?.id || "",
    buyer: offer.buyer || "",
    askPriceWei: BigInt(offer.askPriceWei || "0"),
    escrowAmount: BigInt(offer.escrowAmount || "0"),
    listedAt: BigInt(offer.listedAt || "0"),
    fibreType: Number(offer.lot?.fibreType ?? 0),
    grade: Number(offer.lot?.grade ?? 0),
    weightGrams: BigInt(offer.lot?.weightGrams || "0"),
    gpsZone: offer.lot?.gpsZone || "",
  };
}

/**
 * Loads IN_ESCROW offers for validator payment release.
 */
export function useEscrowOffers() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/market/offers?page=1&limit=100&status=IN_ESCROW", {
        auth: true,
      });
      setOffers((response.data || []).map(mapOffer));
    } catch (err) {
      setError(err?.message || "Failed to load escrow offers");
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOffers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOffers]);

  return { offers, isLoading, error, refetch: fetchOffers };
}
