import { useChainId, useReadContract } from "wagmi";
import { ERC20_ABI } from "../contracts/FarmerMarket";
import { getContractAddresses } from "../contracts/addresses";

export function useCusdBalance(address) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.cUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(addresses && address), refetchInterval: 15_000 },
  });
}
