import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { LotStatus, LotStatusLabel, FibreTypeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, shorten, timeAgo } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";

export default function ValidatorAuditLog() {
  const navigate = useNavigate();
  const { allLots, isLoading } = useLotQueue();

  const decided = allLots.filter(
    (l) => l.status === LotStatus.VALIDATED || l.status === LotStatus.REJECTED
  );

  return (
    <AppLayout role="VALIDATOR" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-headline-md font-bold">Pending Validation Queue</h1>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Reviewing wool lots for LNWMGA compliance.
        </p>

        <div className="flex border-b border-outline-variant mb-4">
          <button onClick={() => navigate("/validator")} className="px-4 py-2 text-body-md text-on-surface-variant">
            Pending Queue
          </button>
          <button className="px-4 py-2 text-body-md font-bold text-primary border-b-2 border-primary">
            Audit Log
          </button>
        </div>

        {isLoading && <p className="text-body-sm text-on-surface-variant">Loading audit log…</p>}
        {!isLoading && decided.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No validation decisions recorded yet.</p>
        )}

        <div className="space-y-3">
          {decided.map((lot) => (
            <div
              key={lot.lotId.toString()}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">Lot #{lot.lotId.toString()}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {FibreTypeLabel[lot.fibreType]} · {gramsToKg(lot.weightGrams)}kg · {shorten(lot.farmer)}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  Validated by {shorten(lot.validatedBy)} · {timeAgo(lot.validatedAt)}
                </p>
              </div>
              <StatusChip status={LotStatusLabel[lot.status]} />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
