import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId, useSignMessage, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useRegisterLot } from "./RegisterLotContext";
import AppLayout from "../../layouts/AppLayout";
import LotStepper from "../../components/ui/LotStepper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { HARVEST_LEDGER_ABI, FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { getContractAddresses } from "../../contracts/addresses";
import { kgToGrams } from "../../lib/utils";
import { apiClient } from "../../lib/apiClient";
import { ensureApiSession } from "../../lib/apiAuth";

export default function RegisterLotReview() {
  const navigate = useNavigate();
  const { form } = useRegisterLot();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);
  const [ipfsError, setIpfsError] = useState("");

  useEffect(() => {
    if (isSuccess && hash) {
      navigate(`/farmer/register/success`, { state: { txHash: hash } });
    }
  }, [isSuccess, hash, navigate]);

  async function handleSign() {
    if (!addresses) return;
    if (!address) {
      setIpfsError("Connect your farmer wallet in MetaMask first.");
      return;
    }

    const weightKg = Number(form.weightKg);
    const weightGrams = kgToGrams(form.weightKg);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightGrams < 1) {
      setIpfsError("Enter a valid lot weight greater than 0 kg, then try again.");
      return;
    }
    if (weightGrams > 4_000_000) {
      setIpfsError("Lot weight cannot exceed 4,000 kg.");
      return;
    }
    if (!form.gpsZone?.trim() || !form.seasonYear?.trim()) {
      setIpfsError("GPS zone and season are required. Go back to step 1 and complete the form.");
      return;
    }

    setIpfsError("");

    try {
      setIsUploadingMetadata(true);
      await ensureApiSession(address, signMessageAsync);
      const ipfsPayload = {
        fibreType: String(form.fibreType ?? 0),
        grade: String(form.grade ?? 0),
        weightGrams: String(weightGrams),
        gpsZone: form.gpsZone.trim(),
        seasonYear: form.seasonYear.trim(),
        storageMethod: form.storageMethod,
        handlingNotes: form.handlingNotes,
        readyForPickup: form.readyForPickup,
      };
      const response = await apiClient.post("/api/ipfs/lot-metadata", ipfsPayload, { auth: true });
      const metadataURI = response?.metadataURI || "";
      if (!metadataURI) {
        throw new Error("IPFS upload did not return metadataURI");
      }

      writeContract({
        address: addresses.harvestLedger,
        abi: HARVEST_LEDGER_ABI,
        functionName: "registerLot",
        args: [
          Number(form.fibreType ?? 0),
          Number(form.grade ?? 0),
          weightGrams,
          form.gpsZone.trim(),
          form.seasonYear.trim(),
          metadataURI,
        ],
      });
    } catch (uploadError) {
      setIpfsError(uploadError?.message || "Failed to upload metadata to IPFS.");
    } finally {
      setIsUploadingMetadata(false);
    }
  }

  const busy = isPending || isConfirming || isUploadingMetadata;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-6 max-w-[1024px] mx-auto">
        <LotStepper current={3} />

        <div className="mt-stack-lg mb-stack-md">
          <h1 className="text-headline-md font-bold text-on-surface">Review Lot Details</h1>
          <p className="text-body-sm text-on-surface-variant">
            Hlahloba lintlha tsa loto ea hau pele u netefatsa.
          </p>
        </div>

        <Card className="grid grid-cols-2 gap-y-stack-md gap-x-gutter-mobile mb-stack-lg">
          <ReviewField label="Fibre Type (Mofuta oa tlhale)" value={FibreTypeLabel[form.fibreType]} />
          <ReviewField label="Grade (Kereiti)" value={GradeLabel[form.grade]} />
          <ReviewField label="Weight (Boima)" value={`${form.weightKg}kg`} />
          <ReviewField label="Zone (Sebaka)" value={form.gpsZone} />
          <div className="col-span-2">
            <ReviewField label="Season (Nako ea selemo)" value={form.seasonYear} />
          </div>
          <ReviewField label="Storage (Boloko)" value={form.storageMethod} />
          <ReviewField
            label="Pickup Ready (Ho nkuoa)"
            value={form.readyForPickup ? "Yes / Ee" : "Not yet / Ha e so e be"}
          />
        </Card>

        {form.handlingNotes && (
          <Card className="mb-stack-md bg-surface-container">
            <p className="text-label-sm text-on-surface-variant">Handling notes</p>
            <p className="font-semibold text-body-sm">{form.handlingNotes}</p>
          </Card>
        )}

        <div className="flex gap-stack-sm p-stack-md bg-secondary-container/20 rounded-lg border border-secondary-container mb-stack-lg">
          <Icon name="gavel" className="text-secondary shrink-0" />
          <p className="text-body-sm text-on-secondary-container">
            By signing, you confirm that this ledger entry represents a genuine harvest. This
            action is recorded on the blockchain.
          </p>
        </div>

        {(error || ipfsError) && (
          <p className="text-body-sm text-error mb-3">
            {ipfsError || error.shortMessage || error.message?.split("\n")[0]}
          </p>
        )}

        <Button
          onClick={handleSign}
          disabled={busy}
          loading={busy}
          size="lg"
          icon={!busy ? <Icon name="edit_document" /> : null}
        >
          {isUploadingMetadata
            ? "Uploading metadata to IPFS..."
            : isPending
              ? "Confirm in wallet…"
              : isConfirming
                ? "Registering on-chain..."
                : "Sign & Register / Ngolisa"}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate(-1)} disabled={busy} className="mt-3">
          Back / Khutla
        </Button>
      </div>
    </AppLayout>
  );
}

function ReviewField({ label, value }) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-body-md font-bold text-primary">{value}</p>
    </div>
  );
}
