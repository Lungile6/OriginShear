/* eslint-disable react-refresh/only-export-components */
// This file intentionally exports the RoleProvider component alongside
// the Role enum and useRole hook — standard React context file shape.
import { createContext, useContext, useMemo } from "react";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import { HARVEST_LEDGER_ABI } from "../contracts/HarvestLedger";
import { INDUSTRY_MARK_REGISTRY_ABI } from "../contracts/IndustryMarkRegistry";
import { getContractAddresses } from "../contracts/addresses";

const RoleContext = createContext(null);

export const Role = {
  FARMER: "FARMER",
  VALIDATOR: "VALIDATOR",
  GOVERNMENT: "GOVERNMENT", // IndustryMarkRegistry GOVERNMENT_ROLE
  BUYER: "BUYER",
  NONE: "NONE",
};

/**
 * Resolves the connected wallet's on-chain role(s).
 * Government access requires GOVERNMENT_ROLE on IndustryMarkRegistry.
 * Farmer/Validator roles are checked on HarvestLedger.
 */
export function RoleProvider({ children }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const ledgerContract = addresses
    ? { address: addresses.harvestLedger, abi: HARVEST_LEDGER_ABI }
    : null;

  const registryContract = addresses
    ? { address: addresses.industryMarkRegistry, abi: INDUSTRY_MARK_REGISTRY_ABI }
    : null;

  const { data: roleHashes } = useReadContracts({
    contracts:
      ledgerContract && registryContract
        ? [
            { ...ledgerContract, functionName: "FARMER_ROLE" },
            { ...ledgerContract, functionName: "VALIDATOR_ROLE" },
            { ...ledgerContract, functionName: "DEFAULT_ADMIN_ROLE" },
            { ...registryContract, functionName: "GOVERNMENT_ROLE" },
          ]
        : [],
    query: { enabled: Boolean(ledgerContract && registryContract) },
  });

  const [farmerRoleHash, validatorRoleHash, adminRoleHash, govRoleHash] =
    roleHashes?.map((r) => r.result) ?? [];

  const { data: roleChecks, isLoading } = useReadContracts({
    contracts:
      ledgerContract && registryContract && address && farmerRoleHash && govRoleHash
        ? [
            { ...ledgerContract, functionName: "hasRole", args: [farmerRoleHash, address] },
            { ...ledgerContract, functionName: "hasRole", args: [validatorRoleHash, address] },
            { ...ledgerContract, functionName: "hasRole", args: [adminRoleHash, address] },
            { ...registryContract, functionName: "hasRole", args: [govRoleHash, address] },
          ]
        : [],
    query: {
      enabled: Boolean(ledgerContract && registryContract && address && farmerRoleHash && govRoleHash),
    },
  });

  const { data: farmerProfile } = useReadContract({
    ...ledgerContract,
    functionName: "farmers",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(ledgerContract && address) },
  });

  const value = useMemo(() => {
    const [isFarmer, isValidator, isAdmin, isGovPublisher] = roleChecks?.map((r) => r.result) ?? [
      false,
      false,
      false,
      false,
    ];

    const roles = [];
    if (isFarmer) roles.push(Role.FARMER);
    if (isValidator) roles.push(Role.VALIDATOR);
    if (isGovPublisher) roles.push(Role.GOVERNMENT);
    if (isConnected) roles.push(Role.BUYER);

    let primaryRole = Role.NONE;
    if (isGovPublisher) primaryRole = Role.GOVERNMENT;
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
      isGovPublisher,
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
