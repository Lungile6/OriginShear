import { useEffect, useState, useCallback } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { INDUSTRY_MARK_REGISTRY_ABI } from "../contracts/IndustryMarkRegistry";
import { getContractAddresses } from "../contracts/addresses";

/**
 * Hook to retrieve all industry marks issued on-chain by reading the
 * MarkIssued events and calling getMark() on the IndustryMarkRegistry contract.
 */
export function useIndustryMarks() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const publicClient = usePublicClient();
  const [marks, setMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMarks = useCallback(async () => {
    if (!publicClient || !addresses?.industryMarkRegistry) return;

    setIsLoading(true);
    try {
      const logs = await publicClient.getContractEvents({
        address: addresses.industryMarkRegistry,
        abi: INDUSTRY_MARK_REGISTRY_ABI,
        eventName: "MarkIssued",
        fromBlock: "earliest",
      });

      const markIds = logs.map((log) => log.args.markId);

      const detailedMarks = await Promise.all(
        markIds.map(async (id) => {
          try {
            const markResult = await publicClient.readContract({
              address: addresses.industryMarkRegistry,
              abi: INDUSTRY_MARK_REGISTRY_ABI,
              functionName: "getMark",
              args: [id],
            });
            return {
              markId: markResult[0],
              farmer: markResult[1],
              farmerId: markResult[2],
              markType: markResult[3],
              description: markResult[4],
              issuedAt: markResult[5],
              expiresAt: markResult[6],
              status: markResult[7],
              issuedBy: markResult[8],
              metadataURI: markResult[9],
            };
          } catch (err) {
            console.error(`Error reading mark detail for ID ${id}:`, err);
            return null;
          }
        })
      );

      const validMarks = detailedMarks
        .filter((m) => m !== null)
        .sort((a, b) => Number(b.markId) - Number(a.markId));

      setMarks(validMarks);
    } catch (err) {
      console.error("Error reading MarkIssued logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, addresses]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  return { marks, isLoading, refetch: fetchMarks };
}
