import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { HARVEST_LEDGER_ABI } from "../contracts/HarvestLedger";
import { getContractAddresses } from "../contracts/addresses";

/**
 * Fetches farmer lots directly from HarvestLedger on-chain.
 * (API/subgraph lists can lag or point at old addresses after redeploy.)
 */
export function useFarmerLots(farmerAddress) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const ledgerContract = addresses
    ? { address: addresses.harvestLedger, abi: HARVEST_LEDGER_ABI }
    : null;

  const {
    data: lotIds,
    isLoading: loadingIds,
    refetch: refetchIds,
  } = useReadContract({
    ...ledgerContract,
    functionName: "getFarmerLots",
    args: farmerAddress ? [farmerAddress] : undefined,
    query: { enabled: Boolean(ledgerContract && farmerAddress) },
  });

  const ids = Array.isArray(lotIds) ? lotIds : [];

  const {
    data: lotResults,
    isLoading: loadingLots,
    refetch: refetchLots,
  } = useReadContracts({
    contracts: ledgerContract
      ? ids.map((id) => ({
          ...ledgerContract,
          functionName: "getLot",
          args: [id],
        }))
      : [],
    query: { enabled: Boolean(ledgerContract && ids.length > 0) },
  });

  const lots = (lotResults ?? [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => r.result)
    .sort((a, b) => Number(b.lotId) - Number(a.lotId));

  return {
    lots,
    isLoading: Boolean(farmerAddress) && (loadingIds || (ids.length > 0 && loadingLots)),
    refetch: async () => {
      await refetchIds();
      await refetchLots();
    },
  };
}
