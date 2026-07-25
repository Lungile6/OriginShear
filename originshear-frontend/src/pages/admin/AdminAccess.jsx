import { useCallback, useState } from "react";
import { isAddress } from "viem";
import {
  useChainId,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "../../layouts/AppLayout";
import { getContractAddresses } from "../../contracts/addresses";
import { HARVEST_LEDGER_ABI } from "../../contracts/HarvestLedger";
import { INDUSTRY_MARK_REGISTRY_ABI } from "../../contracts/IndustryMarkRegistry";
import { DISPUTE_RESOLUTION_ABI } from "../../contracts/DisputeResolution";
import {
  buildFarmerGrantTxs,
  buildFarmerRevokeTxs,
  buildValidatorGrantTxs,
  buildValidatorRevokeTxs,
  buildGovernmentGrantTxs,
  buildGovernmentRevokeTxs,
} from "../../lib/adminRoleActions";
import { shorten } from "../../lib/utils";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { FormField, inputClassName } from "../../components/ui/FormField";
import AdminDirectory from "../../components/admin/AdminDirectory";

function StatusPill({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold ${
        ok ? "bg-role-farmer/15 text-role-farmer" : "bg-surface-container text-on-surface-variant"
      }`}
    >
      <Icon name={ok ? "check_circle" : "cancel"} className="!text-base" />
      {label}
    </span>
  );
}

/**
 * Admin Access panel — DEFAULT_ADMIN_ROLE wallet grants/revokes access via MetaMask.
 */
export default function AdminAccess() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [walletInput, setWalletInput] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [district, setDistrict] = useState("");
  const [lookupWallet, setLookupWallet] = useState("");

  const [busy, setBusy] = useState(false);
  const [stepLabel, setStepLabel] = useState("");
  const [queueDone, setQueueDone] = useState(false);
  const [queueError, setQueueError] = useState("");

  const target = isAddress(lookupWallet) ? lookupWallet : null;

  const { data: roleHashes } = useReadContracts({
    contracts: addresses
      ? [
          { address: addresses.harvestLedger, abi: HARVEST_LEDGER_ABI, functionName: "FARMER_ROLE" },
          { address: addresses.harvestLedger, abi: HARVEST_LEDGER_ABI, functionName: "VALIDATOR_ROLE" },
          {
            address: addresses.industryMarkRegistry,
            abi: INDUSTRY_MARK_REGISTRY_ABI,
            functionName: "GOVERNMENT_ROLE",
          },
          ...(addresses.disputeResolution &&
          addresses.disputeResolution !== "0x0000000000000000000000000000000000000000"
            ? [
                {
                  address: addresses.disputeResolution,
                  abi: DISPUTE_RESOLUTION_ABI,
                  functionName: "ARBITER_ROLE",
                },
              ]
            : []),
        ]
      : [],
    query: { enabled: Boolean(addresses?.harvestLedger && addresses?.industryMarkRegistry) },
  });

  const farmerRoleHash = roleHashes?.[0]?.result;
  const validatorRoleHash = roleHashes?.[1]?.result;
  const governmentRoleHash = roleHashes?.[2]?.result;
  const arbiterRoleHash = roleHashes?.[3]?.result;

  const { data: targetRoles, refetch: refetchTargetRoles, isFetching: loadingRoles } =
    useReadContracts({
      contracts:
        addresses && target && farmerRoleHash && validatorRoleHash && governmentRoleHash
          ? [
              {
                address: addresses.harvestLedger,
                abi: HARVEST_LEDGER_ABI,
                functionName: "hasRole",
                args: [farmerRoleHash, target],
              },
              {
                address: addresses.harvestLedger,
                abi: HARVEST_LEDGER_ABI,
                functionName: "hasRole",
                args: [validatorRoleHash, target],
              },
              {
                address: addresses.industryMarkRegistry,
                abi: INDUSTRY_MARK_REGISTRY_ABI,
                functionName: "hasRole",
                args: [governmentRoleHash, target],
              },
            ]
          : [],
      query: {
        enabled: Boolean(
          addresses && target && farmerRoleHash && validatorRoleHash && governmentRoleHash
        ),
      },
    });

  const { data: farmerProfile, refetch: refetchFarmerProfile } = useReadContract({
    address: addresses?.harvestLedger,
    abi: HARVEST_LEDGER_ABI,
    functionName: "farmers",
    args: target ? [target] : undefined,
    query: { enabled: Boolean(addresses?.harvestLedger && target) },
  });

  const [isFarmer, isValidator, isGovernment] = targetRoles?.map((r) => Boolean(r.result)) ?? [
    false,
    false,
    false,
  ];
  const farmerRegistered = Boolean(farmerProfile?.[3]);

  const refreshLookup = useCallback(() => {
    refetchTargetRoles();
    refetchFarmerProfile();
    queryClient.invalidateQueries();
  }, [refetchTargetRoles, refetchFarmerProfile, queryClient]);

  const runQueue = useCallback(
    async (txs) => {
      if (!txs?.length) {
        setQueueError("No transactions to submit — check contract addresses and role hashes.");
        return;
      }
      if (!publicClient) {
        setQueueError("No chain client available. Check your network connection.");
        return;
      }

      setBusy(true);
      setQueueError("");
      setQueueDone(false);
      setStepLabel("");

      try {
        for (let i = 0; i < txs.length; i++) {
          const step = txs[i];
          setStepLabel(`${i + 1}/${txs.length}: ${step.label}`);
          const hash = await writeContractAsync({
            address: step.address,
            abi: step.abi,
            functionName: step.functionName,
            args: step.args,
          });
          await publicClient.waitForTransactionReceipt({ hash });
        }
        setQueueDone(true);
        setStepLabel("");
        refreshLookup();
      } catch (err) {
        setQueueError(err?.shortMessage || err?.message || "Transaction failed");
        setStepLabel("");
      } finally {
        setBusy(false);
      }
    },
    [publicClient, writeContractAsync, refreshLookup]
  );

  function handleLookup(e) {
    e?.preventDefault?.();
    const next = walletInput.trim();
    if (!isAddress(next)) {
      setQueueError("Enter a valid wallet address (0x…).");
      return;
    }
    setQueueError("");
    setLookupWallet(next);
  }

  function selectWalletFromDirectory(wallet) {
    if (!isAddress(wallet)) return;
    setWalletInput(wallet);
    setLookupWallet(wallet);
    setQueueError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const actionCtx = {
    addresses,
    wallet: target,
    farmerRoleHash,
    validatorRoleHash,
    governmentRoleHash,
    arbiterRoleHash,
    farmerAlreadyRegistered: farmerRegistered,
    farmerId: farmerId.trim() || "LSO-FARMER",
    district: district.trim() || "Maseru",
  };

  return (
    <AppLayout role="ADMIN" title="Admin Access">
      <div className="px-margin-mobile pt-4">
        <PageHeader
          title="Access control"
          subtitle="Register farmers and grant or revoke roles. Confirm each MetaMask prompt in order."
        />
      </div>

      <section className="px-margin-mobile space-y-stack-md pb-4">
        <AdminDirectory onSelectWallet={selectWalletFromDirectory} />

        <Card>
          <h2 className="text-headline-sm font-bold text-on-surface mb-1">Lookup wallet</h2>
          <p className="text-body-sm text-on-surface-variant mb-4">
            Paste the user&apos;s Celo address to see their current roles, then grant or revoke.
          </p>
          <form onSubmit={handleLookup} className="space-y-3">
            <FormField label="Wallet address">
              <input
                className={inputClassName}
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="0x…"
                autoComplete="off"
                spellCheck={false}
              />
            </FormField>
            <Button type="submit" variant="navy" icon={<Icon name="search" />}>
              Look up
            </Button>
          </form>
        </Card>

        {target && (
          <>
            <Card>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase mb-1">Target</p>
                  <code className="text-body-sm font-semibold">{shorten(target, 8, 6)}</code>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onClick={refreshLookup}
                  loading={loadingRoles}
                  icon={<Icon name="refresh" />}
                >
                  Refresh
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill ok={isFarmer} label="Farmer" />
                <StatusPill ok={isValidator} label="Validator" />
                <StatusPill ok={isGovernment} label="Government" />
              </div>
              {farmerRegistered && (
                <p className="text-body-sm text-on-surface-variant mt-3">
                  Farmer profile: {farmerProfile[1]} · {farmerProfile[2]}
                  {!isFarmer && " (registered; role revoked — re-grant without re-register)"}
                </p>
              )}
            </Card>

            <Card>
              <h2 className="text-headline-sm font-bold text-on-surface mb-1">Farmer</h2>
              <p className="text-body-sm text-on-surface-variant mb-4">
                First-time access uses registerFarmer; re-grant uses grantRole if the profile already
                exists.
              </p>
              {!farmerRegistered && (
                <div className="grid gap-3 mb-4">
                  <FormField label="Farmer ID">
                    <input
                      className={inputClassName}
                      value={farmerId}
                      onChange={(e) => setFarmerId(e.target.value)}
                      placeholder="LSO-QUT-001"
                    />
                  </FormField>
                  <FormField label="District">
                    <input
                      className={inputClassName}
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Quthing"
                    />
                  </FormField>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy || isFarmer}
                  onClick={() => runQueue(buildFarmerGrantTxs(actionCtx))}
                  icon={<Icon name="person_add" />}
                >
                  {farmerRegistered ? "Grant farmer" : "Register farmer"}
                </Button>
                <Button
                  type="button"
                  variant="outline-error"
                  disabled={busy || !isFarmer}
                  onClick={() => runQueue(buildFarmerRevokeTxs(actionCtx))}
                  icon={<Icon name="person_off" />}
                >
                  Revoke farmer
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-headline-sm font-bold text-on-surface mb-1">Validator</h2>
              <p className="text-body-sm text-on-surface-variant mb-4">
                Grants VALIDATOR_ROLE on HarvestLedger + FarmerMarket and ARBITER_ROLE on disputes.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="navy"
                  disabled={busy || isValidator}
                  onClick={() => runQueue(buildValidatorGrantTxs(actionCtx))}
                  icon={<Icon name="verified_user" />}
                >
                  Grant validator
                </Button>
                <Button
                  type="button"
                  variant="outline-error"
                  disabled={busy || !isValidator}
                  onClick={() => runQueue(buildValidatorRevokeTxs(actionCtx))}
                  icon={<Icon name="block" />}
                >
                  Revoke validator
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-headline-sm font-bold text-on-surface mb-1">Government</h2>
              <p className="text-body-sm text-on-surface-variant mb-4">
                Grants GOVERNMENT_ROLE on IndustryMarkRegistry, NewsBulletin, and GasSubsidyPool.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  className="bg-role-government"
                  disabled={busy || isGovernment}
                  onClick={() => runQueue(buildGovernmentGrantTxs(actionCtx))}
                  icon={<Icon name="account_balance" />}
                >
                  Grant government
                </Button>
                <Button
                  type="button"
                  variant="outline-error"
                  disabled={busy || !isGovernment}
                  onClick={() => runQueue(buildGovernmentRevokeTxs(actionCtx))}
                  icon={<Icon name="block" />}
                >
                  Revoke government
                </Button>
              </div>
            </Card>
          </>
        )}

        {(busy || stepLabel || queueDone || queueError) && (
          <Card>
            {busy && stepLabel && (
              <p className="text-body-sm text-on-surface flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Confirm in MetaMask — {stepLabel}
              </p>
            )}
            {queueDone && !busy && (
              <p className="text-body-sm text-role-farmer font-semibold flex items-center gap-2">
                <Icon name="check_circle" />
                All transactions confirmed. Roles refreshed.
              </p>
            )}
            {queueError && (
              <p className="text-body-sm text-error flex items-start gap-2">
                <Icon name="error" />
                <span>{queueError}</span>
              </p>
            )}
          </Card>
        )}
      </section>
    </AppLayout>
  );
}
