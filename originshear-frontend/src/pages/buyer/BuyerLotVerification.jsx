import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
          subtitle="Enter lot details or open a QR verification link from a bale tag."
        />

        <Card role="buyer">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Icon name="qr_code_scanner" />
            <span className="font-semibold text-body-sm">Manual Verification</span>
          </div>
          <FormField label="Lot ID">
            <input
              value={manualLotId}
              onChange={(e) => setManualLotId(e.target.value)}
              placeholder="e.g. 12"
              className={inputClassName}
            />
          </FormField>
          <FormField label="Proof Hash">
            <input
              value={manualProof}
              onChange={(e) => setManualProof(e.target.value)}
              placeholder="0x…"
              className={`${inputClassName} font-mono`}
            />
          </FormField>
          <LotVerificationPanel lotId={lotId} proof={proof} showDownloadButton={false} />
        </Card>
      </div>
    </AppLayout>
  );
}
