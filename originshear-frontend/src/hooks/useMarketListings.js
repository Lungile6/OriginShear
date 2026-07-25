import { useMemo } from "react";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { HARVEST_LEDGER_ABI, LotStatus } from "../contracts/HarvestLedger";
import { FARMER_MARKET_ABI, OfferStatus } from "../contracts/FarmerMarket";
import { getContractAddresses } from "../contracts/addresses";

const MAX_LOTS_SCAN = 200;

/**
 * Loads LISTED market offers by reading HarvestLedger + FarmerMarket on-chain.
 * Avoids depending on The Graph (which can lag or sit empty after redeploys).
 */
export function useMarketListings() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const ledger = addresses?.harvestLedger;
  const market = addresses?.farmerMarket;

  const {
    data: totalLotsRaw,
    isLoading: loadingTotal,
    refetch: refetchTotal,
    error: totalError,
  } = useReadContract({
    address: ledger,
    abi: HARVEST_LEDGER_ABI,
    functionName: "totalLots",
    query: { enabled: Boolean(ledger) },
  });

  const totalLots = Number(totalLotsRaw ?? 0n);
  const scanCount = Math.min(totalLots, MAX_LOTS_SCAN);
  const lotIds = useMemo(
    () => Array.from({ length: scanCount }, (_, i) => BigInt(i + 1)),
    [scanCount]
  );

  const {
    data: lotResults,
    isLoading: loadingLots,
    refetch: refetchLots,
    error: lotsError,
  } = useReadContracts({
    contracts: lotIds.map((id) => ({
      address: ledger,
      abi: HARVEST_LEDGER_ABI,
      functionName: "getLot",
      args: [id],
    })),
    query: { enabled: Boolean(ledger && lotIds.length > 0) },
  });

  const validatedLots = useMemo(() => {
    return (lotResults ?? [])
      .filter((r) => r.status === "success" && r.result)
      .map((r) => r.result)
      .filter((lot) => Number(lot.status) === LotStatus.VALIDATED);
  }, [lotResults]);

  const {
    data: offerIdResults,
    isLoading: loadingOfferIds,
    refetch: refetchOfferIds,
  } = useReadContracts({
    contracts: validatedLots.map((lot) => ({
      address: market,
      abi: FARMER_MARKET_ABI,
      functionName: "lotToOffer",
      args: [lot.lotId],
    })),
    query: { enabled: Boolean(market && validatedLots.length > 0) },
  });

  const listedPairs = useMemo(() => {
    return validatedLots
      .map((lot, i) => ({
        lot,
        offerId: offerIdResults?.[i]?.result,
      }))
      .filter((p) => p.offerId && Number(p.offerId) > 0);
  }, [validatedLots, offerIdResults]);

  const {
    data: offerResults,
    isLoading: loadingOffers,
    refetch: refetchOffers,
    error: offersError,
  } = useReadContracts({
    contracts: listedPairs.map((p) => ({
      address: market,
      abi: FARMER_MARKET_ABI,
      functionName: "offers",
      args: [p.offerId],
    })),
    query: { enabled: Boolean(market && listedPairs.length > 0) },
  });

  const listings = useMemo(() => {
    return listedPairs
      .map((pair, i) => {
        const offer = offerResults?.[i]?.result;
        if (!offer) return null;
        const status = Number(offer[6]);
        if (status !== OfferStatus.LISTED) return null;
        const lot = pair.lot;
        return {
          offerId: offer[0],
          lotId: offer[1],
          farmer: offer[2],
          askPriceWei: offer[3],
          listedAt: offer[7],
          fibreType: Number(lot.fibreType),
          grade: Number(lot.grade),
          weightGrams: BigInt(lot.weightGrams),
          gpsZone: lot.gpsZone || "",
          seasonYear: lot.seasonYear || "",
          proofOfOrigin: lot.proofOfOrigin || "",
          lotStatus: Number(lot.status),
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(b.listedAt) - Number(a.listedAt));
  }, [listedPairs, offerResults]);

  /** Validated lots not yet listed — shown so verified inventory is visible. */
  const verifiedUnlisted = useMemo(() => {
    const listedLotIds = new Set(listings.map((l) => l.lotId.toString()));
    return validatedLots
      .filter((lot) => !listedLotIds.has(lot.lotId.toString()))
      .map((lot) => ({
        offerId: 0n,
        lotId: lot.lotId,
        farmer: lot.farmer,
        askPriceWei: 0n,
        listedAt: lot.validatedAt || lot.registeredAt || 0n,
        fibreType: Number(lot.fibreType),
        grade: Number(lot.grade),
        weightGrams: BigInt(lot.weightGrams),
        gpsZone: lot.gpsZone || "",
        seasonYear: lot.seasonYear || "",
        proofOfOrigin: lot.proofOfOrigin || "",
        lotStatus: Number(lot.status),
        unlisted: true,
      }))
      .sort((a, b) => Number(b.lotId) - Number(a.lotId));
  }, [validatedLots, listings]);

  const isLoading =
    Boolean(ledger) &&
    (loadingTotal ||
      (lotIds.length > 0 && loadingLots) ||
      (validatedLots.length > 0 && loadingOfferIds) ||
      (listedPairs.length > 0 && loadingOffers));

  const error =
    totalError?.shortMessage ||
    lotsError?.shortMessage ||
    offersError?.shortMessage ||
    (!ledger ? "Contract addresses not configured for this network" : "");

  async function refetch() {
    await refetchTotal();
    await refetchLots();
    await refetchOfferIds();
    await refetchOffers();
  }

  return {
    listings,
    verifiedUnlisted,
    isLoading,
    error,
    refetch,
  };
}
