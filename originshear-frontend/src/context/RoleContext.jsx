/* eslint-disable react-refresh/only-export-components */
// This file intentionally exports the RoleProvider component alongside
// the Role enum and useRole hook — standard React context file shape.
import { createContext, useContext, useMemo } from "react";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import { HARVEST_LEDGER_ABI } from "../contracts/HarvestLedger";
import { getContractAddresses } from "../contracts/addresses";

const RoleContext = createContext(null);

export const Role = {
  FARMER: "FARMER",
  VALIDATOR: "VALIDATOR",
  GOVERNMENT: "GOVERNMENT", // DEFAULT_ADMIN_ROLE doubles as GOV_PUBLISHER for now
  NONE: "NONE",
};

/**
 * Resolves the connected wallet's on-chain role(s) against HarvestLedger.
 * A wallet can in principle hold multiple roles (e.g. the deployer holds
 * both DEFAULT_ADMIN_ROLE and VALIDATOR_ROLE) — `roles` exposes all of
 * them, while `primaryRole` picks the highest-privilege one for routing.
 */
export function RoleProvider({ children }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const ledgerContract = addresses
    ? { address: addresses.harvestLedger, abi: HARVEST_LEDGER_ABI }
    : null;

  const { data: roleHashes } = useReadContracts({
    contracts: ledgerContract
      ? [
          { ...ledgerContract, functionName: "FARMER_ROLE" },
          { ...ledgerContract, functionName: "VALIDATOR_ROLE" },
          { ...ledgerContract, functionName: "DEFAULT_ADMIN_ROLE" },
        ]
      : [],
    query: { enabled: Boolean(ledgerContract) },
  });

  const [farmerRoleHash, validatorRoleHash, adminRoleHash] =
    roleHashes?.map((r) => r.result) ?? [];

  const { data: roleChecks, isLoading } = useReadContracts({
    contracts:
      ledgerContract && address && farmerRoleHash
        ? [
            { ...ledgerContract, functionName: "hasRole", args: [farmerRoleHash, address] },
            { ...ledgerContract, functionName: "hasRole", args: [validatorRoleHash, address] },
            { ...ledgerContract, functionName: "hasRole", args: [adminRoleHash, address] },
          ]
        : [],
    query: { enabled: Boolean(ledgerContract && address && farmerRoleHash) },
  });

  const { data: farmerProfile } = useReadContract({
    ...ledgerContract,
    functionName: "farmers",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(ledgerContract && address) },
  });

  const value = useMemo(() => {
    const [isFarmer, isValidator, isAdmin] = roleChecks?.map((r) => r.result) ?? [
      false,
      false,
      false,
    ];

    const roles = [];
    if (isFarmer) roles.push(Role.FARMER);
    if (isValidator) roles.push(Role.VALIDATOR);
    if (isAdmin) roles.push(Role.GOVERNMENT);

    // Priority for routing when a wallet holds multiple roles: government
    // (admin) screens are the most privileged, then validator, then farmer.
    let primaryRole = Role.NONE;
    if (isAdmin) primaryRole = Role.GOVERNMENT;
    else if (isValidator) primaryRole = Role.VALIDATOR;
    else if (isFarmer) primaryRole = Role.FARMER;

    return {
      isConnected,
      address,
      chainId,
      hasContracts: Boolean(addresses),
      isLoadingRoles: isLoading,
      roles,
      primaryRole,
      isFarmer,
      isValidator,
      isAdmin,
      farmerProfile: farmerProfile
        ? {
            wallet: farmerProfile[0],
            farmerId: farmerProfile[1],
            district: farmerProfile[2],
            active: farmerProfile[3],
            totalLotsRegistered: farmerProfile[4],
            totalWeightGrams: farmerProfile[5],
          }
        : null,
    };
  }, [roleChecks, isConnected, address, chainId, addresses, isLoading, farmerProfile]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
