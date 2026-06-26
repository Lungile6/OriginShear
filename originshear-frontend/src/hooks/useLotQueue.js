import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { HARVEST_LEDGER_ABI, LotStatus } from "../contracts/HarvestLedger";
import { getContractAddresses } from "../contracts/addresses";

/**
 * Enumerates all lots 1..totalLots() and returns the ones still PENDING,
 * for the validator queue. Also returns the full list (any status) for
 * the Audit Log tab.
 */
export function useLotQueue() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const ledgerContract = addresses ? { address: addresses.harvestLedger, abi: HARVEST_LEDGER_ABI } : null;

  const { data: total, isLoading: loadingTotal } = useReadContract({
    ...ledgerContract,
    functionName: "totalLots",
    query: { enabled: Boolean(ledgerContract) },
  });

  const lotIds = total ? Array.from({ length: Number(total) }, (_, i) => i + 1) : [];

  const {
    data: lotResults,
    isLoading: loadingLots,
    refetch,
  } = useReadContracts({
    contracts: ledgerContract
      ? lotIds.map((id) => ({ ...ledgerContract, functionName: "getLot", args: [id] }))
      : [],
    query: { enabled: Boolean(ledgerContract && lotIds.length > 0) },
  });

  const allLots = (lotResults ?? [])
    .filter((r) => r.status === "success")
    .map((r) => r.result)
    .sort((a, b) => Number(b.lotId) - Number(a.lotId));

  const pendingLots = allLots.filter((l) => l.status === LotStatus.PENDING);

  return {
    allLots,
    pendingLots,
    isLoading: loadingTotal || loadingLots,
    refetch,
  };
}
