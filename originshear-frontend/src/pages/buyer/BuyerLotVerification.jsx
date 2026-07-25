import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import LotVerificationPanel from "../../components/lot/LotVerificationPanel";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { FormField, inputClassName } from "../../components/ui/FormField";

export default function BuyerLotVerification() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [manualLotId, setManualLotId] = useState("");
  const [manualProof, setManualProof] = useState("");

  const lotId = params.lotId || manualLotId;
  const proof = searchParams.get("proof") || manualProof;

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <PageHeader
          en="Verify Lot Origin"
          st="Netefatsa Tšimoloho ea Loto"
          subtitle="Paste the Lot ID and proof hash from a farmer’s bale tag or QR page."
        />

        <Card role="buyer" className="mb-stack-md">
          <h2 className="font-bold text-on-surface mb-2 flex items-center gap-2">
            <Icon name="info" className="text-primary" />
            Where do I get Lot ID &amp; proof hash?
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-body-sm text-on-surface-variant">
            <li>
              <span className="font-semibold text-on-surface">Easiest:</span> scan the QR on the
              farmer’s bale tag — it opens this page with both values filled in.
            </li>
            <li>
              Ask the farmer to open <span className="font-semibold text-on-surface">My Lots</span>{" "}
              → the lot → <span className="font-semibold text-on-surface">View QR Proof</span>, then
              copy <span className="font-semibold text-on-surface">Lot ID</span> and{" "}
              <span className="font-semibold text-on-surface">Proof hash</span>.
            </li>
            <li>
              Or open a marketplace lot and tap{" "}
              <span className="font-semibold text-on-surface">Open Full Verify</span> (proof is
              included in the link).
            </li>
          </ol>
          <p className="text-label-sm text-on-surface-variant mt-3">
            Public verify link (no login):{" "}
            <Link to="/verify" className="text-primary font-semibold">
              /verify
            </Link>
          </p>
        </Card>

        <Card role="buyer">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Icon name="qr_code_scanner" />
            <span className="font-semibold text-body-sm">Manual Verification</span>
          </div>
          <FormField label="Lot ID (number after # on the farmer’s lot)">
            <input
              value={manualLotId}
              onChange={(e) => setManualLotId(e.target.value)}
              placeholder="e.g. 12"
              inputMode="numeric"
              className={inputClassName}
            />
          </FormField>
          <FormField label="Proof hash (0x… from QR Proof or lot detail)">
            <input
              value={manualProof}
              onChange={(e) => setManualProof(e.target.value)}
              placeholder="0x…"
              className={`${inputClassName} font-mono`}
              spellCheck={false}
            />
          </FormField>
          <LotVerificationPanel lotId={lotId} proof={proof} showDownloadButton={false} />
        </Card>
      </div>
    </AppLayout>
  );
}
