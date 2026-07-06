import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import LotVerificationPanel from "../../components/lot/LotVerificationPanel";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";
import { FormField, inputClassName } from "../../components/ui/FormField";

export default function PublicLotVerification() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [manualLotId, setManualLotId] = useState("");
  const [manualProof, setManualProof] = useState("");

  const lotId = params.lotId || manualLotId;
  const proof = searchParams.get("proof") || manualProof;

  if (!lotId || !proof) {
    return (
      <div className="min-h-dvh bg-background px-margin-mobile py-8">
        <header className="flex items-center gap-2 mb-6">
          <Icon name="grass" className="text-primary" />
          <span className="text-headline-sm font-bold text-primary uppercase">ORIGINSHEAR</span>
        </header>
        <Card className="max-w-sm mx-auto">
          <h1 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
            <Icon name="verified" className="text-primary" />
            Verify a Lot
          </h1>
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
          <LotVerificationPanel lotId={manualLotId} proof={manualProof} showDownloadButton={false} />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-margin-mobile py-6">
      <header className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate("/")} className="text-on-surface-variant">
          <Icon name="account_circle" />
        </button>
        <span className="text-headline-sm font-bold text-primary uppercase">ORIGINSHEAR</span>
      </header>

      <div className="max-w-sm mx-auto">
        <LotVerificationPanel lotId={lotId} proof={proof} />
      </div>
    </div>
  );
}
