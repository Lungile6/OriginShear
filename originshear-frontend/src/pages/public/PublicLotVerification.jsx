import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useChainId, useReadContract } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { VERIFIER_ABI } from "../../contracts/ProofOfOriginVerifier";
import { FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { getContractAddresses } from "../../contracts/addresses";
import { gramsToKg, shorten } from "../../lib/utils";

/**
 * Public, walletless verification screen. Designed to be the landing
 * target when someone scans a Lot QR code — works with no wallet
 * connection since ProofOfOriginVerifier.verify() is a free view call.
 * Falls back to Alfajores if no wallet/chain is connected at all.
 */
export default function PublicLotVerification() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const connectedChainId = useChainId();
  const chainId = connectedChainId || celoAlfajores.id;
  const addresses = getContractAddresses(chainId);

  const [manualLotId, setManualLotId] = useState("");
  const [manualProof, setManualProof] = useState("");

  const lotId = params.lotId || manualLotId;
  const proof = searchParams.get("proof") || manualProof;

  const { data: result, isLoading, isError, error } = useReadContract({
    address: addresses?.verifier,
    abi: VERIFIER_ABI,
    functionName: "verify",
    args: lotId && proof ? [BigInt(lotId), proof] : undefined,
    query: { enabled: Boolean(addresses && lotId && proof) },
  });

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
          <p className="text-label-sm text-on-surface-variant">
            Scan the QR code on a wool/mohair lot, or paste its lot ID and proof hash above.
          </p>
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
        {isLoading && <p className="text-center text-body-sm text-on-surface-variant py-12">Verifying on Celo…</p>}

        {isError && (
          <div className="bg-error-container/40 border border-error/30 rounded-xl p-6 text-center">
            <p className="font-bold text-error mb-1">Verification failed</p>
            <p className="text-body-sm text-on-surface-variant">{error?.shortMessage || "Could not reach the verifier contract."}</p>
          </div>
        )}

        {result && (
          <>
            <div className="flex flex-col items-center text-center mb-5">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  result.valid ? "bg-primary" : "bg-error"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-10 w-10">
                  {result.valid ? (
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                  )}
                </svg>
              </div>
              <h1 className="text-headline-md font-bold text-primary">
                {result.valid ? "VALIDATED LOT" : "PROOF MISMATCH"}
              </h1>
              <p className="text-body-sm text-on-surface-variant mb-3">
                {result.valid ? "Loto e Netefalitsoeng" : "This hash does not match our records"}
              </p>
              {result.valid && (
                <a
                  href={`https://${chainId === celoAlfajores.id ? "alfajores." : ""}celoscan.io/address/${addresses?.harvestLedger}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-secondary-container text-on-secondary-container rounded-full px-4 py-1.5 text-label-sm font-semibold"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
                  </svg>
                  Verified on Celo Blockchain
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
              <FieldRow icon="id" label="Farmer Identity (Boitsebiso ba Sehoai)" value={shorten(result.farmer, 8, 6)} />
              <div className="grid grid-cols-2 gap-4">
                <FieldRow icon="material" label="Material (Thepa)" value={FibreTypeLabel[result.fibreType]} />
                <FieldRow icon="grade" label="Grade (Boemo)" value={`Grade ${GradeLabel[result.grade]}`} />
                <FieldRow icon="weight" label="Weight (Boima)" value={`${gramsToKg(result.weightGrams)}kg`} />
                <FieldRow icon="zone" label="Zone (Sebaka)" value={result.gpsZone} />
              </div>
              <FieldRow icon="season" label="Season (Nako)" value={`Harvest ${result.seasonYear}`} />
            </div>

            <button className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold mt-5 flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download Verification (PDF)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const FIELD_ICONS = {
  id: <path d="M5 7h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />,
  material: <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />,
  grade: <path d="M12 17.3 6.2 21l1.6-6.9L2 9.2l7-.6L12 2l3 6.6 7 .6-5.8 4.9 1.6 6.9z" strokeLinejoin="round" />,
  weight: <path d="M4 7h16M4 7l1.5 12.5A2 2 0 0 0 7.5 21h9a2 2 0 0 0 2-1.5L20 7" strokeLinecap="round" strokeLinejoin="round" />,
  zone: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.5" /></>,
  season: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" /></>,
};

function FieldRow({ icon, label, value }) {
  return (
    <div className="bg-surface-container rounded-lg p-3">
      <p className="text-label-sm text-on-surface-variant uppercase mb-1">{label}</p>
      <p className="font-bold text-body-md flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-on-surface-variant">
          {FIELD_ICONS[icon]}
        </svg>
        {value}
      </p>
    </div>
  );
}
