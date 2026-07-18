import { useState } from "react";
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getContractAddresses } from "../../contracts/addresses";
import { REPUTATION_SYSTEM_ABI, EntityType } from "../../contracts/ReputationSystem";
import Button from "../ui/Button";
import { inputClassName } from "../ui/FormField";

/**
 * Post-purchase review of a farmer (buyer → farmer).
 */
export default function SubmitReviewPanel({ offerId, farmerAddress }) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const reputation = addresses?.reputationSystem;
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess) {
    reset();
    setOpen(false);
    setComment("");
  }

  if (!reputation || !farmerAddress || !offerId) return null;

  function handleSubmit() {
    writeContract({
      address: reputation,
      abi: REPUTATION_SYSTEM_ABI,
      functionName: "submitReview",
      args: [offerId, farmerAddress, EntityType.FARMER, Number(score), comment.trim() || "Good transaction"],
    });
  }

  const busy = isPending || confirming;

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Rate Farmer
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2 border border-outline-variant rounded-xl p-3">
      <label className="block text-label-sm text-on-surface-variant">
        Score (1–5)
        <select
          className={`${inputClassName} mt-1`}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-label-sm text-on-surface-variant">
        Comment
        <input
          className={`${inputClassName} mt-1`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional feedback"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={busy} loading={busy}>
          Submit Review
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-label-sm text-error">{error.shortMessage || error.message}</p>}
    </div>
  );
}
