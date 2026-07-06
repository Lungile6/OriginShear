import { useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { apiClient } from "../../lib/apiClient";
import { gramsToKg, shorten } from "../../lib/utils";
import PageHeader from "../../components/ui/PageHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import { LotCardSkeleton } from "../../components/ui/Skeleton";

export default function ValidatorQueue() {
  const { pendingLots, isLoading, refetch } = useLotQueue();

  return (
    <AppLayout role="VALIDATOR" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <PageHeader
          title="Pending Validation Queue"
          subtitle="Reviewing wool lots for LNWMGA compliance."
        />

        {isLoading && (
          <div className="space-y-stack-md">
            <LotCardSkeleton />
            <LotCardSkeleton />
          </div>
        )}
        {!isLoading && pendingLots.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No lots awaiting validation. Queue is clear.</p>
        )}

        <div className="space-y-stack-md">
          {pendingLots.map((lot, i) => (
            <QueueCard key={lot.lotId.toString()} lot={lot} urgent={i === 0} onDone={refetch} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function QueueCard({ lot, urgent, onDone }) {
  const [modal, setModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lotRef = `#${lot.lotId.toString()}`;

  async function handle(approve) {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await apiClient.put(`/api/lots/${lot.lotId.toString()}/validate`, { approve }, { auth: true });
      setModal(null);
      onDone?.();
    } catch (err) {
      setErrorMessage(err?.message || "Validation request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-container-low flex justify-between items-center">
          <div>
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Lot ID</span>
            <p className="text-body-md font-bold text-on-surface">{lotRef}</p>
          </div>
          {urgent ? (
            <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-label-sm font-bold">
              URGENT
            </span>
          ) : (
            <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant rounded-full text-label-sm font-bold">
              STANDARD
            </span>
          )}
        </div>

        <div className="p-4 grid grid-cols-2 gap-y-4">
          <Field label="Farmer ID (Molemi)" value={shorten(lot.farmer)} />
          <Field label="Weight (Boima)" value={`${gramsToKg(lot.weightGrams)} kg`} />
          <Field label="Grade (Sehlopha)" value={GradeLabel[lot.grade]} />
          <Field label="Material (Thepa)" value={FibreTypeLabel[lot.fibreType]} />
        </div>

        {errorMessage && <p className="px-4 pb-2 text-label-sm text-error">{errorMessage}</p>}

        <div className="p-4 flex gap-4 pt-0">
          <Button
            fullWidth
            className="h-[52px] rounded-xl"
            icon={<Icon name="check_circle" />}
            onClick={() => setModal("approve")}
          >
            Approve ✓
          </Button>
          <Button
            fullWidth
            variant="outline-error"
            className="h-[52px] rounded-xl border-2"
            icon={<Icon name="cancel" />}
            onClick={() => setModal("reject")}
          >
            Reject ✗
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={modal === "approve"}
        title="Confirm Approval"
        message="Are you sure? This action is permanent and recorded on-chain."
        lotRef={lotRef}
        confirmLabel="Approve ✓"
        onConfirm={() => handle(true)}
        onCancel={() => setModal(null)}
        loading={isSubmitting}
      />
      <ConfirmModal
        open={modal === "reject"}
        title="Confirm Rejection"
        message="Are you sure? This action is permanent and recorded on-chain."
        lotRef={lotRef}
        confirmLabel="Reject ✗"
        confirmVariant="danger"
        onConfirm={() => handle(false)}
        onCancel={() => setModal(null)}
        loading={isSubmitting}
      />
    </>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="text-body-md font-semibold">{value}</p>
    </div>
  );
}
