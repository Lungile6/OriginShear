import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
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

export default function RegisterLotReview() {
  const navigate = useNavigate();
  const { form } = useRegisterLot();
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
    setIpfsError("");

    try {
      setIsUploadingMetadata(true);
      const ipfsPayload = {
        fibreType: String(form.fibreType),
        grade: String(form.grade),
        weightGrams: kgToGrams(form.weightKg).toString(),
        gpsZone: form.gpsZone,
        seasonYear: form.seasonYear,
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
          form.fibreType,
          form.grade,
          kgToGrams(form.weightKg),
          form.gpsZone,
          form.seasonYear,
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
