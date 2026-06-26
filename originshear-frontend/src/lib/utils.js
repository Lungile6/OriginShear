import { keccak256, encodePacked, formatUnits, parseUnits } from "viem";

/**
 * Recomputes the Proof of Origin hash client-side, matching
 * HarvestLedger._computeProofOfOrigin() exactly:
 *   keccak256(farmer, lotId, fibreType, grade, weightGrams, gpsZone, seasonYear)
 *
 * Useful for QR generation/display without needing an extra RPC call, and
 * for sanity-checking a value returned from the chain.
 */
export function computeProofOfOrigin({ farmer, lotId, fibreType, grade, weightGrams, gpsZone, seasonYear }) {
  return keccak256(
    encodePacked(
      ["address", "uint256", "uint8", "uint8", "uint32", "string", "string"],
      [farmer, BigInt(lotId), fibreType, grade, weightGrams, gpsZone, seasonYear]
    )
  );
}

/** Shortens an address/hash for compact display: 0xABCD...1234 */
export function shorten(value, lead = 6, tail = 4) {
  if (!value) return "";
  if (value.length <= lead + tail + 2) return value;
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

/** cUSD uses 18 decimals like most ERC-20s on Celo. */
export const CUSD_DECIMALS = 18;

export function formatCUSD(weiValue) {
  if (weiValue === undefined || weiValue === null) return "0.00";
  const formatted = formatUnits(weiValue, CUSD_DECIMALS);
  return Number(formatted).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCUSD(displayValue) {
  return parseUnits(displayValue || "0", CUSD_DECIMALS);
}

// Indicative cUSD -> LSL rate for display purposes only (cUSD is USD-pegged;
// LSL is pegged 1:1 to ZAR, which floats vs USD). Screens in the Stitch
// export show both currencies side by side — replace with a live FX feed
// if precision matters for production.
const INDICATIVE_CUSD_TO_LSL = 17.8;

export function cusdToLSL(weiValue) {
  if (weiValue === undefined || weiValue === null) return "0.00";
  const cusd = Number(formatUnits(weiValue, CUSD_DECIMALS));
  return (cusd * INDICATIVE_CUSD_TO_LSL).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function gramsToKg(grams) {
  return (Number(grams) / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function kgToGrams(kg) {
  return Math.round(Number(kg) * 1000);
}

export function timeAgo(timestampSeconds) {
  if (!timestampSeconds) return "";
  const seconds = Math.floor(Date.now() / 1000) - Number(timestampSeconds);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(Number(timestampSeconds) * 1000).toLocaleDateString();
}
