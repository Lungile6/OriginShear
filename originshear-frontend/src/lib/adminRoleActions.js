import { HARVEST_LEDGER_ABI } from "../contracts/HarvestLedger";
import { FARMER_MARKET_ABI } from "../contracts/FarmerMarket";
import { INDUSTRY_MARK_REGISTRY_ABI } from "../contracts/IndustryMarkRegistry";
import { NEWS_BULLETIN_ABI } from "../contracts/NewsBulletin";
import { GAS_SUBSIDY_POOL_ABI } from "../contracts/GasSubsidyPool";
import { DISPUTE_RESOLUTION_ABI } from "../contracts/DisputeResolution";

const ZERO = "0x0000000000000000000000000000000000000000";

function isDeployed(address) {
  return Boolean(address) && address !== ZERO;
}

function roleTx({ label, address, abi, functionName, role, account }) {
  return {
    label,
    address,
    abi,
    functionName,
    args: [role, account],
  };
}

/**
 * Ordered MetaMask txs to register a farmer (first time) or re-grant FARMER_ROLE.
 * Mirrors scripts/seed-demo.js seedFarmer().
 */
export function buildFarmerGrantTxs({
  addresses,
  wallet,
  farmerId,
  district,
  farmerRoleHash,
  farmerAlreadyRegistered,
}) {
  const txs = [];
  if (!isDeployed(addresses?.harvestLedger) || !farmerRoleHash) return txs;

  if (!farmerAlreadyRegistered) {
    txs.push({
      label: "Register farmer on HarvestLedger",
      address: addresses.harvestLedger,
      abi: HARVEST_LEDGER_ABI,
      functionName: "registerFarmer",
      args: [wallet, farmerId, district],
    });
  } else {
    txs.push(
      roleTx({
        label: "Grant FARMER_ROLE on HarvestLedger",
        address: addresses.harvestLedger,
        abi: HARVEST_LEDGER_ABI,
        functionName: "grantRole",
        role: farmerRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses.gasSubsidyPool)) {
    txs.push(
      roleTx({
        label: "Grant FARMER_ROLE on GasSubsidyPool",
        address: addresses.gasSubsidyPool,
        abi: GAS_SUBSIDY_POOL_ABI,
        functionName: "grantRole",
        role: farmerRoleHash,
        account: wallet,
      })
    );
  }

  return txs;
}

export function buildFarmerRevokeTxs({ addresses, wallet, farmerRoleHash }) {
  const txs = [];
  if (!farmerRoleHash) return txs;

  if (isDeployed(addresses?.harvestLedger)) {
    txs.push(
      roleTx({
        label: "Revoke FARMER_ROLE on HarvestLedger",
        address: addresses.harvestLedger,
        abi: HARVEST_LEDGER_ABI,
        functionName: "revokeRole",
        role: farmerRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.gasSubsidyPool)) {
    txs.push(
      roleTx({
        label: "Revoke FARMER_ROLE on GasSubsidyPool",
        address: addresses.gasSubsidyPool,
        abi: GAS_SUBSIDY_POOL_ABI,
        functionName: "revokeRole",
        role: farmerRoleHash,
        account: wallet,
      })
    );
  }

  return txs;
}

/** Mirrors scripts/seed-demo.js seedValidator(). */
export function buildValidatorGrantTxs({
  addresses,
  wallet,
  validatorRoleHash,
  arbiterRoleHash,
}) {
  const txs = [];
  if (!validatorRoleHash) return txs;

  if (isDeployed(addresses?.harvestLedger)) {
    txs.push(
      roleTx({
        label: "Grant VALIDATOR_ROLE on HarvestLedger",
        address: addresses.harvestLedger,
        abi: HARVEST_LEDGER_ABI,
        functionName: "grantRole",
        role: validatorRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.farmerMarket)) {
    txs.push(
      roleTx({
        label: "Grant VALIDATOR_ROLE on FarmerMarket",
        address: addresses.farmerMarket,
        abi: FARMER_MARKET_ABI,
        functionName: "grantRole",
        role: validatorRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.disputeResolution) && arbiterRoleHash) {
    txs.push(
      roleTx({
        label: "Grant ARBITER_ROLE on DisputeResolution",
        address: addresses.disputeResolution,
        abi: DISPUTE_RESOLUTION_ABI,
        functionName: "grantRole",
        role: arbiterRoleHash,
        account: wallet,
      })
    );
  }

  return txs;
}

export function buildValidatorRevokeTxs({
  addresses,
  wallet,
  validatorRoleHash,
  arbiterRoleHash,
}) {
  const txs = [];
  if (!validatorRoleHash) return txs;

  if (isDeployed(addresses?.harvestLedger)) {
    txs.push(
      roleTx({
        label: "Revoke VALIDATOR_ROLE on HarvestLedger",
        address: addresses.harvestLedger,
        abi: HARVEST_LEDGER_ABI,
        functionName: "revokeRole",
        role: validatorRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.farmerMarket)) {
    txs.push(
      roleTx({
        label: "Revoke VALIDATOR_ROLE on FarmerMarket",
        address: addresses.farmerMarket,
        abi: FARMER_MARKET_ABI,
        functionName: "revokeRole",
        role: validatorRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.disputeResolution) && arbiterRoleHash) {
    txs.push(
      roleTx({
        label: "Revoke ARBITER_ROLE on DisputeResolution",
        address: addresses.disputeResolution,
        abi: DISPUTE_RESOLUTION_ABI,
        functionName: "revokeRole",
        role: arbiterRoleHash,
        account: wallet,
      })
    );
  }

  return txs;
}

/** Mirrors scripts/seed-demo.js seedGovernment(). */
export function buildGovernmentGrantTxs({ addresses, wallet, governmentRoleHash }) {
  const txs = [];
  if (!governmentRoleHash) return txs;

  if (isDeployed(addresses?.industryMarkRegistry)) {
    txs.push(
      roleTx({
        label: "Grant GOVERNMENT_ROLE on IndustryMarkRegistry",
        address: addresses.industryMarkRegistry,
        abi: INDUSTRY_MARK_REGISTRY_ABI,
        functionName: "grantRole",
        role: governmentRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.newsBulletin)) {
    txs.push(
      roleTx({
        label: "Grant GOVERNMENT_ROLE on NewsBulletin",
        address: addresses.newsBulletin,
        abi: NEWS_BULLETIN_ABI,
        functionName: "grantRole",
        role: governmentRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.gasSubsidyPool)) {
    txs.push(
      roleTx({
        label: "Grant GOVERNMENT_ROLE on GasSubsidyPool",
        address: addresses.gasSubsidyPool,
        abi: GAS_SUBSIDY_POOL_ABI,
        functionName: "grantRole",
        role: governmentRoleHash,
        account: wallet,
      })
    );
  }

  return txs;
}

export function buildGovernmentRevokeTxs({ addresses, wallet, governmentRoleHash }) {
  const txs = [];
  if (!governmentRoleHash) return txs;

  if (isDeployed(addresses?.industryMarkRegistry)) {
    txs.push(
      roleTx({
        label: "Revoke GOVERNMENT_ROLE on IndustryMarkRegistry",
        address: addresses.industryMarkRegistry,
        abi: INDUSTRY_MARK_REGISTRY_ABI,
        functionName: "revokeRole",
        role: governmentRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.newsBulletin)) {
    txs.push(
      roleTx({
        label: "Revoke GOVERNMENT_ROLE on NewsBulletin",
        address: addresses.newsBulletin,
        abi: NEWS_BULLETIN_ABI,
        functionName: "revokeRole",
        role: governmentRoleHash,
        account: wallet,
      })
    );
  }

  if (isDeployed(addresses?.gasSubsidyPool)) {
    txs.push(
      roleTx({
        label: "Revoke GOVERNMENT_ROLE on GasSubsidyPool",
        address: addresses.gasSubsidyPool,
        abi: GAS_SUBSIDY_POOL_ABI,
        functionName: "revokeRole",
        role: governmentRoleHash,
        account: wallet,
      })
    );
  }

  return txs;
}
