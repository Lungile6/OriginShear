import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

/**
 * Loads payment history from API for both farmer and buyer views.
 */
export function usePaymentHistory(userAddress) {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userAddress) return;

    let active = true;

    async function fetchPayments() {
      if (active) setIsLoading(true);
      try {
        const [asFarmer, asBuyer] = await Promise.all([
          apiClient.get(`/api/market/payments?page=1&limit=200&farmer=${userAddress}`, { auth: true }),
          apiClient.get(`/api/market/payments?page=1&limit=200&buyer=${userAddress}`, { auth: true }),
        ]);

        const combined = [...(asFarmer.data || []), ...(asBuyer.data || [])];
        const deduped = Array.from(new Map(combined.map((item) => [item.id, item])).values());
        const mapped = deduped.map((payment) => ({
          id: payment.id,
          offerId: BigInt(payment.offer?.offerId || "0"),
          farmer: payment.farmer || "",
          netAmount: BigInt(payment.netAmount || "0"),
          fee: BigInt(payment.fee || "0"),
          timestamp: BigInt(payment.timestamp || "0"),
          lotId: BigInt(payment.offer?.lot?.lotId || "0"),
          askPriceWei: BigInt(payment.offer?.askPriceWei || "0"),
          buyer: payment.offer?.buyer || "",
        }));

        mapped.sort((a, b) => Number(b.timestamp || 0n) - Number(a.timestamp || 0n));

        if (active) {
          setPayments(mapped);
        }
      } catch (err) {
        console.error("Error loading payment history from API:", err);
        if (active) setPayments([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      void fetchPayments();
    }, 0);

    return () => {
      clearTimeout(timer);
      active = false;
    };
  }, [userAddress]);

  return { payments, isLoading };
}
