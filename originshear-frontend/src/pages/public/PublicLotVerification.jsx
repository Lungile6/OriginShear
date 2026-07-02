import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import LotVerificationPanel from "../../components/lot/LotVerificationPanel";

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
      <div className="min-h-dvh bg-background px-4 py-8">
        <header className="flex items-center gap-2 mb-6">
          <span className="text-headline-sm font-bold text-primary uppercase">ORIGINSHEAR</span>
        </header>
        <div className="max-w-sm mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5">
          <h1 className="text-headline-sm font-bold mb-4">Verify a Lot</h1>
          <label className="block text-body-sm font-semibold mb-2">Lot ID</label>
          <input
            value={manualLotId}
            onChange={(e) => setManualLotId(e.target.value)}
            placeholder="e.g. 12"
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-4 text-body-sm"
          />
          <label className="block text-body-sm font-semibold mb-2">Proof Hash</label>
          <input
            value={manualProof}
            onChange={(e) => setManualProof(e.target.value)}
            placeholder="0x…"
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-5 text-body-sm font-mono"
          />
          <LotVerificationPanel lotId={manualLotId} proof={manualProof} showDownloadButton={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6">
      <header className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate("/")} className="text-on-surface-variant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-headline-sm font-bold text-primary uppercase">ORIGINSHEAR</span>
      </header>

      <div className="max-w-sm mx-auto">
        <LotVerificationPanel lotId={lotId} proof={proof} />
      </div>
    </div>
  );
}
