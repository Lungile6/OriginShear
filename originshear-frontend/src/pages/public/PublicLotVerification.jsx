import { useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
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
        <Card className="max-w-sm mx-auto mb-4">
          <h1 className="text-headline-sm font-bold mb-2 flex items-center gap-2">
            <Icon name="verified" className="text-primary" />
            Verify a Lot
          </h1>
          <p className="text-body-sm text-on-surface-variant mb-4">
            You need the <span className="font-semibold text-on-surface">Lot ID</span> and{" "}
            <span className="font-semibold text-on-surface">proof hash</span> from the farmer.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-body-sm text-on-surface-variant mb-4">
            <li>Scan the QR on the bale tag (best — fills both fields automatically).</li>
            <li>
              Or ask the farmer: <span className="font-semibold text-on-surface">My Lots</span> →
              open the lot → <span className="font-semibold text-on-surface">View QR Proof</span>, then
              copy Lot ID and Proof hash.
            </li>
          </ol>
          <FormField label="Lot ID">
            <input
              value={manualLotId}
              onChange={(e) => setManualLotId(e.target.value)}
              placeholder="e.g. 12"
              inputMode="numeric"
              className={inputClassName}
            />
          </FormField>
          <FormField label="Proof Hash">
            <input
              value={manualProof}
              onChange={(e) => setManualProof(e.target.value)}
              placeholder="0x…"
              className={`${inputClassName} font-mono`}
              spellCheck={false}
            />
          </FormField>
          <LotVerificationPanel lotId={manualLotId} proof={manualProof} showDownloadButton={false} />
        </Card>
        <p className="text-center text-label-sm text-on-surface-variant">
          <Link to="/" className="text-primary font-semibold">
            Back to home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-margin-mobile py-6">
      <header className="flex items-center gap-2 mb-6">
        <button type="button" onClick={() => navigate("/")} className="text-on-surface-variant">
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
