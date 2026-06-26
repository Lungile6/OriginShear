import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useRegisterLot } from "./RegisterLotContext";
import { Stepper } from "./RegisterLotStep1";
import AppLayout from "../../layouts/AppLayout";
import { HARVEST_LEDGER_ABI, FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { getContractAddresses } from "../../contracts/addresses";
import { kgToGrams } from "../../lib/utils";

export default function RegisterLotReview() {
  const navigate = useNavigate();
  const { form } = useRegisterLot();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash) {
      navigate(`/farmer/register/success`, { state: { txHash: hash } });
    }
  }, [isSuccess, hash, navigate]);

  function handleSign() {
    if (!addresses) return;
    writeContract({
      address: addresses.harvestLedger,
      abi: HARVEST_LEDGER_ABI,
      functionName: "registerLot",
      args: [
        form.fibreType,
        form.grade,
        kgToGrams(form.weightKg),
        form.gpsZone,
        form.seasonYear,
        "", // metadataURI — left blank; wire to IPFS upload later if needed
      ],
    });
  }

  const busy = isPending || isConfirming;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-6">
        <Stepper current={2} />

        <h1 className="text-headline-md font-bold mt-4 mb-1">Review Lot Details</h1>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Hlahloba lintlha tsa loto ea hau pele u netefatsa.
        </p>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 grid grid-cols-2 gap-y-4">
          <ReviewField label="Fibre Type (Mofuta oa tlhale)" value={FibreTypeLabel[form.fibreType]} />
          <ReviewField label="Grade (Kereiti)" value={GradeLabel[form.grade]} />
          <ReviewField label="Weight (Boima)" value={`${form.weightKg}kg`} />
          <ReviewField label="Zone (Sebaka)" value={form.gpsZone} />
          <ReviewField label="Season (Nako ea selemo)" value={form.seasonYear} />
        </div>

        <div className="bg-secondary-container/30 border border-secondary/20 rounded-lg p-4 mt-4 flex gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-secondary shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
          </svg>
          <p className="text-body-sm text-on-secondary-container">
            By signing, you confirm that this ledger entry represents a genuine harvest. This
            action is recorded on the blockchain.
          </p>
        </div>

        {error && (
          <p className="text-body-sm text-error mt-3">
            {error.shortMessage || error.message?.split("\n")[0]}
          </p>
        )}

        <button
          onClick={handleSign}
          disabled={busy}
          className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold mt-6 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" strokeLinejoin="round" />
              <path d="M14 3v6h6" />
            </svg>
          )}
          {isPending ? "Confirm in wallet…" : isConfirming ? "Registering on-chain…" : "Sign & Register / Ngolisa"}
        </button>
        <button
          onClick={() => navigate(-1)}
          disabled={busy}
          className="w-full h-12 rounded-lg border border-outline-variant text-on-surface font-semibold mt-3 disabled:opacity-60"
        >
          Back / Khutla
        </button>
      </div>
    </AppLayout>
  );
}

function ReviewField({ label, value }) {
  return (
    <div>
      <p className="text-body-sm text-on-surface-variant">{label}</p>
      <p className="font-bold text-primary text-body-lg">{value}</p>
    </div>
  );
}
