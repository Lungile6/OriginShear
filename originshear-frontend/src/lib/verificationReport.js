import { FibreTypeLabel, GradeLabel } from "../contracts/HarvestLedger";
import { gramsToKg, shorten } from "./utils";

/**
 * Downloads a plain-text verification certificate for a validated lot.
 */
export function downloadVerificationReport({ lotId, proof, result, chainName = "Celo Sepolia" }) {
  const lines = [
    "ORIGINSHEAR — Proof of Origin Verification Certificate",
    "=======================================================",
    "",
    `Lot ID: ${lotId}`,
    `Proof hash: ${proof}`,
    `Status: ${result.valid ? "VALIDATED" : "INVALID"}`,
    `Network: ${chainName}`,
    `Verified at: ${new Date().toISOString()}`,
    "",
  ];

  if (result.valid) {
    lines.push(
      `Farmer wallet: ${result.farmer}`,
      `Material: ${FibreTypeLabel[result.fibreType]}`,
      `Grade: ${GradeLabel[result.grade]}`,
      `Weight: ${gramsToKg(result.weightGrams)} kg`,
      `GPS Zone: ${result.gpsZone}`,
      `Season: ${result.seasonYear}`,
      "",
      "This certificate confirms the lot hash matches the on-chain HarvestLedger record.",
      `Farmer (short): ${shorten(result.farmer, 8, 6)}`
    );
  } else {
    lines.push("The supplied proof hash does not match on-chain records.");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `originshear-lot-${lotId}-verification.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
