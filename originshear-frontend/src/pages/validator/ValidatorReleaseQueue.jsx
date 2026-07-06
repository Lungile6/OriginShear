import { useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { useEscrowOffers } from "../../hooks/useEscrowOffers";
import { apiClient } from "../../lib/apiClient";
import { FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { formatCUSD, gramsToKg, shorten } from "../../lib/utils";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { LotCardSkeleton } from "../../components/ui/Skeleton";

export default function ValidatorReleaseQueue() {
  const { offers, isLoading, error, refetch } = useEscrowOffers();

  return (
    <AppLayout role="VALIDATOR" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <PageHeader
          en="Escrow Release"
          st="Ho Lokolla Litefiso"
          subtitle="Release cUSD to farmers after buyer purchase is confirmed in escrow."
          action={
            <button type="button" onClick={() => refetch()} className="text-primary text-label-sm font-bold">
              Refresh
            </button>
          }
        />

        {isLoading && (
          <div className="space-y-stack-md">
            <LotCardSkeleton />
          </div>
        )}
        {error && <p className="text-body-sm text-error mb-3">{error}</p>}
        {!isLoading && offers.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            No payments awaiting release. Purchased lots in escrow will appear here.
          </p>
        )}

        <div className="space-y-stack-md">
          {offers.map((offer) => (
            <EscrowReleaseCard key={offer.offerId.toString()} offer={offer} onReleased={refetch} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function EscrowReleaseCard({ offer, onReleased }) {
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState("");

  async function handleRelease() {
    setIsReleasing(true);
    setReleaseError("");
    try {
      await apiClient.post(`/api/market/offers/${offer.offerId.toString()}/release`, {}, { auth: true });
      onReleased?.();
    } catch (err) {
      setReleaseError(err?.message || "Failed to release payment");
    } finally {
      setIsReleasing(false);
    }
  }

  return (
    <Card role="validator">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-label-sm text-on-surface-variant">Lot #{offer.lotId.toString()}</p>
          <p className="font-bold text-headline-sm">
            {FibreTypeLabel[offer.fibreType]} · Grade {GradeLabel[offer.grade]}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {gramsToKg(offer.weightGrams)} kg · {offer.gpsZone}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-headline-sm text-primary">{formatCUSD(offer.askPriceWei)} cUSD</p>
          <span className="bg-tertiary-container text-on-tertiary-container text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
            Payment in Escrow
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-body-sm mb-4">
        <div>
          <span className="text-label-sm uppercase block text-on-surface-variant">Farmer</span>
          <span className="font-semibold">{shorten(offer.farmer)}</span>
        </div>
        <div>
          <span className="text-label-sm uppercase block text-on-surface-variant">Buyer</span>
          <span className="font-semibold">{shorten(offer.buyer)}</span>
        </div>
      </div>
      <Button onClick={handleRelease} disabled={isReleasing} loading={isReleasing} icon={<Icon name="payments" />}>
        Release Payment to Farmer
      </Button>
      {releaseError && <p className="text-label-sm text-error mt-2">{releaseError}</p>}
    </Card>
  );
}
