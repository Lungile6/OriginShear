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
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { LotCardSkeleton } from "../../components/ui/Skeleton";
import { inputClassName } from "../../components/ui/FormField";

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
  const farmerPayments = paymentHistory.filter(
    (p) => p.farmer?.toLowerCase() === address?.toLowerCase()
  );

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <div className="mb-stack-lg">
          <h1 className="text-headline-md font-bold text-on-surface">Sell Your Lot</h1>
          <p className="text-body-md text-on-surface-variant">Rekisa Sela la Hao</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full w-fit mb-stack-lg shadow-sm">
          <Icon name="account_balance_wallet" className="text-primary" size={20} />
          <span className="text-label-sm font-bold text-primary">{formatCUSD(balance)} cUSD</span>
        </div>

        <section className="mb-stack-lg">
          <h2 className="text-label-lg text-primary uppercase tracking-wider mb-stack-sm">
            Validated Lots for Sale
          </h2>
          {isLoading && (
            <div className="space-y-stack-md">
              <LotCardSkeleton />
            </div>
          )}
          {!isLoading && sellableLots.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">No validated lots available to list right now.</p>
          )}
          <div className="space-y-stack-md">
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
        </section>

        {activeOffers.length > 0 && (
          <section className="mb-stack-lg">
            <h2 className="text-label-lg text-primary uppercase tracking-wider mb-stack-sm">
              Active Offers (Litefiso tse Emetseng)
            </h2>
            <div className="grid grid-cols-1 gap-stack-md">
              {activeOffers.map((offer) => (
                <ActiveOfferCard key={offer.offerId.toString()} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {farmerPayments.length > 0 && (
          <section>
            <h2 className="text-label-lg text-primary uppercase tracking-wider mb-stack-sm">
              Payment History (Nalane ea Litefiso)
            </h2>
            <Card padded={false} className="overflow-hidden divide-y divide-outline-variant">
              {farmerPayments.map((payment) => (
                <CompletedOfferRow key={payment.id || payment.offerId.toString()} payment={payment} />
              ))}
            </Card>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

function SellableLotCard({ lot, marketAddress, onListed }) {
  const [askPrice, setAskPrice] = useState("");
  const [expanded, setExpanded] = useState(false);
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
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-label-sm text-on-surface-variant">#{lot.lotId.toString()}</span>
        <h4 className="text-headline-sm font-bold">
          {FibreTypeLabel[lot.fibreType]} (Grade {GradeLabel[lot.grade]})
        </h4>
        <div className="flex gap-4 mt-1">
          <span className="flex items-center gap-1 text-body-sm">
            <Icon name="weight" size={18} className="text-on-surface-variant" />
            {gramsToKg(lot.weightGrams)} kg
          </span>
          <span className="flex items-center gap-1 text-body-sm">
            <Icon name="verified" size={18} className="text-on-surface-variant" />
            Verified Quality
          </span>
        </div>
      </div>

      {!expanded ? (
        <Button fullWidth={false} className="self-start px-6 rounded-[10px]" onClick={() => setExpanded(true)}>
          List for Sale (Rekisa)
        </Button>
      ) : (
        <div className="bg-primary-container/10 border-2 border-primary-container rounded-xl p-4 space-y-stack-md">
          <h3 className="text-headline-sm text-primary-container flex items-center gap-2 font-bold">
            <Icon name="sell" />
            Listing Details: #{lot.lotId.toString()}
          </h3>
          <div>
            <label className="block text-label-lg text-on-surface mb-2">Price in cUSD (Theko ka cUSD)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={askPrice}
                onChange={(e) => setAskPrice(e.target.value)}
                placeholder="0.00"
                className={`${inputClassName} text-headline-sm pr-16`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                cUSD
              </span>
            </div>
            <p className="mt-2 text-primary font-bold text-body-lg">
              ≈ {askPrice ? cusdToLSL(parseCUSD(askPrice)) : "0.00"} LSL
            </p>
          </div>
          <Button onClick={handleList} disabled={busy || !askPrice} loading={busy}>
            Confirm Listing (Netefatsa)
          </Button>
          <p className="text-label-sm text-on-surface-variant text-center">Includes 2% platform fee on final sale</p>
        </div>
      )}
      {error && <p className="text-label-sm text-error">{error.shortMessage}</p>}
    </Card>
  );
}

function ActiveOfferCard({ offer }) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-2">
        <span className="text-label-sm text-on-surface-variant">Lot #{offer.lotId.toString()}</span>
        <span className="bg-tertiary-container text-on-tertiary-container text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
          {OfferStatusLabel[offer.status]}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-body-md font-bold">{formatCUSD(offer.askPriceWei)} cUSD</p>
          {offer.status === OfferStatus.IN_ESCROW && (
            <p className="text-label-sm text-on-surface-variant font-mono">Buyer: {shorten(offer.buyer)}</p>
          )}
        </div>
        {offer.status === OfferStatus.IN_ESCROW && (
          <p className="text-label-sm text-on-surface-variant max-w-[140px] text-right">
            Awaiting LNWMGA validator to release payment
          </p>
        )}
      </div>
    </Card>
  );
}

function CompletedOfferRow({ payment }) {
  return (
    <div className="p-4 flex justify-between items-center">
      <div>
        <p className="text-body-md font-bold text-on-surface">{formatCUSD(payment.netAmount)} cUSD</p>
        <p className="text-label-sm text-on-surface-variant">Lot #{payment.lotId.toString()} · Net Earnings</p>
      </div>
      <div className="text-right">
        <span className="text-primary font-bold text-label-sm">+ {cusdToLSL(payment.netAmount)} LSL</span>
        <p className="text-[10px] text-on-surface-variant">Net after 2% fee</p>
      </div>
    </div>
  );
}
