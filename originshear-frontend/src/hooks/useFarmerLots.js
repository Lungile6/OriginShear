import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { HARVEST_LEDGER_ABI } from "../contracts/HarvestLedger";
import { getContractAddresses } from "../contracts/addresses";

/**
 * Fetches the connected farmer's lot IDs, then batches a getLot() read for
 * each one. Returns a flattened, ready-to-render array of lot objects.
 */
export function useFarmerLots(farmerAddress) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const ledgerContract = addresses ? { address: addresses.harvestLedger, abi: HARVEST_LEDGER_ABI } : null;

  const { data: lotIds, isLoading: loadingIds, refetch: refetchIds } = useReadContract({
    ...ledgerContract,
    functionName: "getFarmerLots",
    args: farmerAddress ? [farmerAddress] : undefined,
    query: { enabled: Boolean(ledgerContract && farmerAddress) },
  });

  const {
    data: lotResults,
    isLoading: loadingLots,
    refetch: refetchLots,
  } = useReadContracts({
    contracts:
      ledgerContract && lotIds
        ? lotIds.map((id) => ({ ...ledgerContract, functionName: "getLot", args: [id] }))
        : [],
    query: { enabled: Boolean(ledgerContract && lotIds && lotIds.length > 0) },
  });

  const lots = (lotResults ?? [])
    .filter((r) => r.status === "success")
    .map((r) => r.result)
    .sort((a, b) => Number(b.lotId) - Number(a.lotId)); // newest first

  return {
    lots,
    isLoading: loadingIds || loadingLots,
    refetch: () => {
      refetchIds();
      refetchLots();
    },
  };
}
