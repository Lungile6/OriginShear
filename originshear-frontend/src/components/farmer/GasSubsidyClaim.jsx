import { useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { getContractAddresses } from "../../contracts/addresses";
import { GAS_SUBSIDY_POOL_ABI } from "../../contracts/GasSubsidyPool";
import { formatCUSD, parseCUSD } from "../../lib/utils";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { inputClassName } from "../ui/FormField";

export default function GasSubsidyClaim() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const pool = addresses?.gasSubsidyPool;
  const [amount, setAmount] = useState("1.00");
  const [reason, setReason] = useState("Gas subsidy for lot registration");

  const { data: available, refetch: refetchAvailable } = useReadContract({
    address: pool,
    abi: GAS_SUBSIDY_POOL_ABI,
    functionName: "availableClaim",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(pool && address) },
  });

  const { data: poolBalance } = useReadContract({
    address: pool,
    abi: GAS_SUBSIDY_POOL_ABI,
    functionName: "currentBalance",
    query: { enabled: Boolean(pool) },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess) {
    refetchAvailable();
    reset();
  }

  if (!pool || pool === "0x0000000000000000000000000000000000000000") return null;

  function handleClaim() {
    const wei = parseCUSD(amount);
    if (wei <= 0n) return;
    writeContract({
      address: pool,
      abi: GAS_SUBSIDY_POOL_ABI,
      functionName: "claimSubsidy",
      args: [wei, reason || "Gas subsidy"],
    });
  }

  const busy = isPending || confirming;
  const availableWei = available ?? 0n;

  return (
    <section className="px-margin-mobile mt-stack-lg">
      <Card role="farmer">
        <div className="flex items-start gap-3 mb-3">
          <span className="bg-primary/10 text-primary rounded-lg p-2">
            <Icon name="local_gas_station" />
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-on-surface">Gas Subsidy</h3>
            <p className="text-label-sm text-on-surface-variant">
              Claim cUSD from platform fees to cover transaction gas ·{" "}
              {formatCUSD(availableWei)} available today
            </p>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Pool balance: {formatCUSD(poolBalance ?? 0n)} cUSD
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-label-sm text-on-surface-variant">
            Amount (cUSD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClassName} mt-1`}
            />
          </label>
          <label className="block text-label-sm text-on-surface-variant">
            Reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClassName} mt-1`}
            />
          </label>
        </div>
        <Button className="mt-3" onClick={handleClaim} disabled={busy || availableWei === 0n} loading={busy}>
          Claim Subsidy
        </Button>
        {error && (
          <p className="text-label-sm text-error mt-2">
            {error.shortMessage || error.message}
            {(error.message || "").includes("AccessControl") || (error.shortMessage || "").includes("AccessControl")
              ? " — Ask admin to grant FARMER_ROLE on GasSubsidyPool."
              : ""}
          </p>
        )}
      </Card>
    </section>
  );
}
