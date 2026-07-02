import { useState } from "react";
import { useAccount, useChainId, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { useFarmerLots } from "../../hooks/useFarmerLots";
import { useCusdBalance } from "../../hooks/useCusdBalance";
import { usePaymentHistory } from "../../hooks/usePaymentHistory";
import { LotStatus, FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { FARMER_MARKET_ABI, OfferStatus, OfferStatusLabel } from "../../contracts/FarmerMarket";
import { getContractAddresses } from "../../contracts/addresses";
import { gramsToKg, formatCUSD, cusdToLSL, parseCUSD, shorten } from "../../lib/utils";

export default function FarmerMarketSell() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const { lots, isLoading, refetch } = useFarmerLots(address);
  const { data: balance } = useCusdBalance(address);
  const { payments: paymentHistory } = usePaymentHistory(address);

  const validatedUnlisted = lots.filter((l) => l.status === LotStatus.VALIDATED);
  const lotIds = validatedUnlisted.map((l) => l.lotId);

  const marketContract = addresses ? { address: addresses.farmerMarket, abi: FARMER_MARKET_ABI } : null;

  // Resolve offerId for each validated lot, then fetch the offer + filter
  // to ones this farmer actually owns/listed.
  const { data: offerIdResults } = useReadContracts({
    contracts: marketContract
      ? lotIds.map((id) => ({ ...marketContract, functionName: "lotToOffer", args: [id] }))
      : [],
    query: { enabled: Boolean(marketContract && lotIds.length > 0) },
  });

  const offerIds = (offerIdResults ?? [])
    .map((r) => r.result)
    .filter((id) => id && Number(id) > 0);

  const { data: offerResults, refetch: refetchOffers } = useReadContracts({
    contracts: marketContract
      ? offerIds.map((id) => ({ ...marketContract, functionName: "offers", args: [id] }))
      : [],
    query: { enabled: Boolean(marketContract && offerIds.length > 0) },
  });

  const offers = (offerResults ?? [])
    .filter((r) => r.status === "success")
    .map((r, i) => ({
      offerId: offerIds[i],
      lotId: r.result[1],
      farmer: r.result[2],
      askPriceWei: r.result[3],
      buyer: r.result[4],
      escrowAmount: r.result[5],
      status: r.result[6],
    }))
    .filter((o) => o.farmer?.toLowerCase() === address?.toLowerCase());

  const listedLotIds = new Set(offers.map((o) => o.lotId.toString()));
  const sellableLots = validatedUnlisted.filter((l) => !listedLotIds.has(l.lotId.toString()));
  const activeOffers = offers.filter((o) => o.status === OfferStatus.IN_ESCROW || o.status === OfferStatus.LISTED);
  const completedOffers = offers.filter((o) => o.status === OfferStatus.COMPLETED);

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-headline-md font-bold">Sell Your Lot</h1>
            <p className="text-body-sm text-on-surface-variant">Rekisa Sela la Hao</p>
          </div>
          <span className="bg-surface-container rounded-full px-3 py-1.5 text-label-sm font-bold flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <rect x="3" y="6" width="18" height="13" rx="2" />
            </svg>
            {formatCUSD(balance)} cUSD
          </span>
        </div>

        <h2 className="text-label-lg text-primary uppercase tracking-widest mb-2">
          Validated Lots for Sale
        </h2>
        {isLoading && <p className="text-body-sm text-on-surface-variant mb-4">Loading…</p>}
        {!isLoading && sellableLots.length === 0 && (
          <p className="text-body-sm text-on-surface-variant mb-4">
            No validated lots available to list right now.
          </p>
        )}
        <div className="space-y-3 mb-6">
          {sellableLots.map((lot) => (
            <SellableLotCard
              key={lot.lotId.toString()}
              lot={lot}
              marketAddress={addresses?.farmerMarket}
              onListed={() => {
                refetch();
                refetchOffers();
              }}
            />
          ))}
        </div>

        {activeOffers.length > 0 && (
          <>
            <h2 className="text-label-lg text-primary uppercase tracking-widest mb-2">
              Active Offers (Litefiso tse Emetseng)
            </h2>
            <div className="space-y-3 mb-6">
              {activeOffers.map((offer) => (
                <ActiveOfferCard key={offer.offerId.toString()} offer={offer} />
              ))}
            </div>
          </>
        )}

        {paymentHistory.length > 0 && (
          <>
            <h2 className="text-label-lg text-primary uppercase tracking-widest mb-2">
              Payment History (Nalane ea Litefiso)
            </h2>
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm divide-y divide-outline-variant">
              {paymentHistory.map((payment) => (
                <CompletedOfferRow key={payment.offerId.toString()} payment={payment} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function SellableLotCard({ lot, marketAddress, onListed }) {
  const [askPrice, setAskPrice] = useState("");
  const [listing, setListing] = useState(false);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess && listing) {
    setListing(false);
    onListed?.();
  }

  function handleList() {
    if (!askPrice || Number(askPrice) <= 0) return;
    setListing(true);
    writeContract({
      address: marketAddress,
      abi: FARMER_MARKET_ABI,
      functionName: "listLot",
      args: [lot.lotId, parseCUSD(askPrice)],
    });
  }

  const busy = isPending || isConfirming;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
      <p className="text-label-sm text-on-surface-variant">#2026-{lot.lotId.toString().padStart(3, "0")}</p>
      <p className="font-bold text-body-lg mb-1">
        {FibreTypeLabel[lot.fibreType]} (Grade {GradeLabel[lot.grade]})
      </p>
      <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mb-3">
        <span className="flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <rect x="4" y="7" width="16" height="13" rx="1.5" />
          </svg>
          {gramsToKg(lot.weightGrams)} kg
        </span>
        <span className="flex items-center gap-1 text-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="12" cy="12" r="9" />
            <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified Quality
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          value={askPrice}
          onChange={(e) => setAskPrice(e.target.value)}
          placeholder="Ask price (cUSD)"
          className="flex-1 h-11 rounded-lg border border-outline-variant bg-surface-container px-3 text-body-sm focus:border-primary focus:border-2 outline-none"
        />
        <button
          onClick={handleList}
          disabled={busy || !askPrice}
          className="h-11 px-5 rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-60"
        >
          {busy ? "…" : "List for Sale"}
        </button>
      </div>
      {error && <p className="text-label-sm text-error mt-2">{error.shortMessage}</p>}
    </div>
  );
}

function ActiveOfferCard({ offer }) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  function handleRelease() {
    writeContract({
      address: addresses.farmerMarket,
      abi: FARMER_MARKET_ABI,
      functionName: "releasePayment",
      args: [offer.offerId],
    });
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 flex justify-between items-center">
      <div>
        <p className="text-label-sm text-on-surface-variant">Lot #{offer.lotId.toString()}</p>
        <p className="font-bold text-headline-sm">{formatCUSD(offer.askPriceWei)} cUSD</p>
        <p className="text-label-sm text-on-surface-variant">Buyer: {shorten(offer.buyer)}</p>
      </div>
      <div className="text-right">
        <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full px-3 py-1 text-label-sm font-semibold mb-2">
          {OfferStatusLabel[offer.status]}
        </span>
        {offer.status === OfferStatus.IN_ESCROW && (
          <button
            onClick={handleRelease}
            disabled={isPending || isConfirming}
            className="block h-9 px-4 rounded-lg border border-outline-variant text-on-surface text-label-sm font-semibold disabled:opacity-60"
          >
            {isPending || isConfirming ? "…" : "Release Fibre"}
          </button>
        )}
      </div>
    </div>
  );
}

function CompletedOfferRow({ payment }) {
  return (
    <div className="p-4 flex justify-between items-center">
      <div>
        <p className="font-bold text-body-lg">{formatCUSD(payment.netAmount)} cUSD</p>
        <p className="text-label-sm text-on-surface-variant">Lot #{payment.lotId.toString()} · Net Earnings</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">+{cusdToLSL(payment.netAmount)} LSL</p>
        <p className="text-[10px] text-on-surface-variant">
          Fee: {formatCUSD(payment.fee)} cUSD (2%)
        </p>
      </div>
    </div>
  );
}
