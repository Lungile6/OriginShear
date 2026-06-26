import { useParams, useNavigate, Link } from "react-router-dom";
import { useChainId, useReadContract } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { HARVEST_LEDGER_ABI, FibreTypeLabel, GradeLabel, LotStatus, LotStatusLabel } from "../../contracts/HarvestLedger";
import { getContractAddresses } from "../../contracts/addresses";
import { gramsToKg, shorten, timeAgo } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";

export default function LotDetail() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data: lot, isLoading } = useReadContract({
    address: addresses?.harvestLedger,
    abi: HARVEST_LEDGER_ABI,
    functionName: "getLot",
    args: [BigInt(lotId)],
    query: { enabled: Boolean(addresses && lotId) },
  });

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-on-surface-variant mb-3 text-body-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {isLoading && <p className="text-body-sm text-on-surface-variant">Loading lot…</p>}

        {lot && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase">Lot ID</p>
                <p className="text-headline-md font-bold text-primary">#{lotId}</p>
              </div>
              <StatusChip status={LotStatusLabel[lot.status]} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Fibre Type" value={FibreTypeLabel[lot.fibreType]} />
              <Field label="Grade" value={GradeLabel[lot.grade]} />
              <Field label="Weight" value={`${gramsToKg(lot.weightGrams)} kg`} />
              <Field label="GPS Zone" value={lot.gpsZone} />
              <Field label="Season" value={lot.seasonYear} />
              <Field label="Registered" value={timeAgo(lot.registeredAt)} />
            </div>

            {lot.status !== LotStatus.PENDING && (
              <Field label="Validated By" value={`${shorten(lot.validatedBy)} · ${timeAgo(lot.validatedAt)}`} />
            )}

            <hr className="border-outline-variant my-4" />
            <p className="text-label-sm text-on-surface-variant uppercase mb-1">Proof of Origin Hash</p>
            <code className="text-body-sm break-all">{lot.proofOfOrigin}</code>

            {lot.status === LotStatus.VALIDATED && (
              <Link
                to={`/farmer/lots/${lotId}/qr`}
                className="w-full h-12 rounded-lg bg-primary text-on-primary font-semibold mt-5 flex items-center justify-center gap-2"
              >
                View QR Proof
              </Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
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
