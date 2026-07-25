import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useChainId, useReadContract } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import {
  HARVEST_LEDGER_ABI,
  FibreTypeLabel,
  GradeLabel,
  LotStatus,
  LotStatusLabel,
} from "../../contracts/HarvestLedger";
import { getContractAddresses } from "../../contracts/addresses";
import { gramsToKg, shorten, timeAgo } from "../../lib/utils";
import { toGatewayUrl } from "../../lib/ipfs";
import StatusChip from "../../components/ui/StatusChip";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import LotVerifyCredentials from "../../components/lot/LotVerifyCredentials";

export default function LotDetail() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const [copiedField, setCopiedField] = useState("");

  const { data: lot, isLoading } = useReadContract({
    address: addresses?.harvestLedger,
    abi: HARVEST_LEDGER_ABI,
    functionName: "getLot",
    args: [BigInt(lotId)],
    query: { enabled: Boolean(addresses && lotId) },
  });

  function copy(value, field) {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 1500);
  }

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-on-surface-variant mb-3 text-body-sm"
        >
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
                <div className="flex items-center gap-2">
                  <p className="text-headline-md font-bold text-primary">#{lotId}</p>
                  <button
                    type="button"
                    onClick={() => copy(lotId, "lotId")}
                    className="text-primary text-label-sm font-semibold inline-flex items-center gap-1"
                  >
                    <Icon name="content_copy" className="!text-base" />
                    {copiedField === "lotId" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  Share this ID with buyers for verification
                </p>
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
              <Field
                label="Validated By"
                value={`${shorten(lot.validatedBy)} · ${timeAgo(lot.validatedAt)}`}
              />
            )}

            {lot.status === LotStatus.VALIDATED ? (
              <div className="mt-4">
                <LotVerifyCredentials lotId={lotId} proofHash={lot.proofOfOrigin} />
                <div className="mt-3 space-y-2">
                  <Link to={`/farmer/lots/${lotId}/qr`}>
                    <Button icon={<Icon name="qr_code_2" />}>Full-screen QR for bale tag</Button>
                  </Link>
                  <Link to="/farmer/market">
                    <Button variant="outline" icon={<Icon name="storefront" />}>
                      List on marketplace
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <hr className="border-outline-variant my-4" />
                <p className="text-label-sm text-on-surface-variant uppercase mb-1">
                  Proof of Origin Hash
                </p>
                <button
                  type="button"
                  onClick={() => copy(lot.proofOfOrigin, "proof")}
                  className="w-full text-left bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant"
                >
                  <code className="text-body-sm break-all text-primary">{lot.proofOfOrigin}</code>
                  <span className="block text-label-sm font-semibold text-primary mt-2">
                    {copiedField === "proof" ? "Copied proof hash" : "Tap to copy proof hash"}
                  </span>
                </button>
              </>
            )}

            {lot.metadataURI && (
              <>
                <p className="text-label-sm text-on-surface-variant uppercase mt-4 mb-1">
                  Metadata URI
                </p>
                <a
                  href={toGatewayUrl(lot.metadataURI)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-body-sm text-primary underline break-all"
                >
                  {lot.metadataURI}
                </a>
              </>
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
