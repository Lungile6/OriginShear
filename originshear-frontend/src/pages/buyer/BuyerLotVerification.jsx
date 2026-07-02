import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import LotVerificationPanel from "../../components/lot/LotVerificationPanel";
import BilingualText from "../../components/ui/BilingualText";

export default function BuyerLotVerification() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [manualLotId, setManualLotId] = useState("");
  const [manualProof, setManualProof] = useState("");

  const lotId = params.lotId || manualLotId;
  const proof = searchParams.get("proof") || manualProof;

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <h1 className="text-headline-md font-bold mb-1">
          <BilingualText en="Verify Lot Origin" st="Netefatsa Tšimoloho ea Loto" size="headline-md" />
        </h1>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Enter lot details or open a QR verification link from a bale tag.
        </p>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 mb-4">
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
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-3 text-body-sm font-mono"
          />
          <LotVerificationPanel lotId={lotId} proof={proof} showDownloadButton={false} />
        </div>
      </div>
    </AppLayout>
  );
}
