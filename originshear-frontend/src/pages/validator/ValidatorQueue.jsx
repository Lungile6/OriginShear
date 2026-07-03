import { useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { apiClient } from "../../lib/apiClient";
import { gramsToKg, shorten } from "../../lib/utils";

export default function ValidatorQueue() {
  const { pendingLots, isLoading, refetch } = useLotQueue();

  return (
    <AppLayout role="VALIDATOR" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-headline-md font-bold">Pending Validation Queue</h1>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Reviewing wool lots for LNWMGA compliance.
        </p>

        {isLoading && <p className="text-body-sm text-on-surface-variant">Loading queue…</p>}
        {!isLoading && pendingLots.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No lots awaiting validation. Queue is clear.</p>
        )}

        <div className="space-y-4">
          {pendingLots.map((lot, i) => (
            <QueueCard key={lot.lotId.toString()} lot={lot} urgent={i === 0} onDone={refetch} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function QueueCard({ lot, urgent, onDone }) {
  const [action, setAction] = useState(null); // "approve" | "reject" | null
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handle(approve) {
    setAction(approve ? "approve" : "reject");
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await apiClient.put(
        `/api/lots/${lot.lotId.toString()}/validate`,
        { approve },
        { auth: true }
      );
      onDone?.();
    } catch (err) {
      setErrorMessage(err?.message || "Validation request failed");
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  }

  const busy = isSubmitting;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-surface-container-high">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase">Lot ID</p>
          <p className="font-bold">#LSO-{lot.lotId.toString().padStart(5, "0")}-X</p>
        </div>
        {urgent ? (
          <span className="bg-role-government/20 text-role-government rounded-full px-3 py-1 text-label-sm font-bold uppercase">
            Urgent
          </span>
        ) : (
          <span className="bg-surface-container-highest text-on-surface-variant rounded-full px-3 py-1 text-label-sm font-bold uppercase">
            Standard
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Farmer (Molemi)" value={shorten(lot.farmer)} />
          <Field label="Weight (Boima)" value={`${gramsToKg(lot.weightGrams)} kg`} />
          <Field label="Grade (Sehlopha)" value={GradeLabel[lot.grade]} />
          <Field label="Material (Thepa)" value={FibreTypeLabel[lot.fibreType]} />
        </div>

        {errorMessage && <p className="text-label-sm text-error mb-2">{errorMessage}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => handle(true)}
            disabled={busy}
            className="flex-1 h-12 rounded-lg bg-primary text-on-primary font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && action === "approve" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <circle cx="12" cy="12" r="9" />
                <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Approve
          </button>
          <button
            onClick={() => handle(false)}
            disabled={busy}
            className="flex-1 h-12 rounded-lg border border-error text-error font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && action === "reject" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
              </svg>
            )}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-bold text-body-md">{value}</p>
    </div>
  );
}
