import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DISPUTE_RESOLUTION_ABI, DisputeType, DisputeTypeLabel } from "../../contracts/DisputeResolution";
import Button from "../ui/Button";
import { inputClassName } from "../ui/FormField";

/**
 * Wallet-direct dispute open for an IN_ESCROW offer (farmer or buyer).
 */
export default function OpenDisputePanel({ disputeAddress, offerId, onOpened }) {
  const [disputeType, setDisputeType] = useState(DisputeType.QUALITY_MISMATCH);
  const [description, setDescription] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess) {
    onOpened?.();
    reset();
    setExpanded(false);
    setDescription("");
  }

  if (!disputeAddress || !offerId) return null;

  function handleOpen() {
    if (!description.trim()) return;
    writeContract({
      address: disputeAddress,
      abi: DISPUTE_RESOLUTION_ABI,
      functionName: "openDispute",
      args: [offerId, Number(disputeType), description.trim()],
    });
  }

  const busy = isPending || confirming;

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
        Open Dispute
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 border border-outline-variant rounded-xl p-3 bg-surface-container/40">
      <p className="text-label-sm font-bold text-on-surface">Open a dispute on this escrow</p>
      <label className="block text-label-sm text-on-surface-variant">
        Reason
        <select
          className={`${inputClassName} mt-1`}
          value={disputeType}
          onChange={(e) => setDisputeType(Number(e.target.value))}
        >
          {Object.entries(DisputeTypeLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-label-sm text-on-surface-variant">
        Description
        <textarea
          className={`${inputClassName} mt-1 min-h-[80px]`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue clearly for the arbiter…"
        />
      </label>
      <div className="flex gap-2">
        <Button onClick={handleOpen} disabled={busy || !description.trim()} loading={busy}>
          Submit Dispute
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setExpanded(false);
            reset();
          }}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-label-sm text-error">{error.shortMessage || error.message}</p>}
      <p className="text-[10px] text-on-surface-variant">
        Requires a redeployed DisputeResolution that reads live FarmerMarket offers. Offer must be IN_ESCROW.
      </p>
    </div>
  );
}
