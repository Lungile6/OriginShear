import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Card from "../ui/Card";
import Icon from "../ui/Icon";
import Button from "../ui/Button";

/**
 * Lot ID + proof hash + QR for easy origin verification.
 * Used when opening a validated lot (marketplace or farmer detail).
 */
export default function LotVerifyCredentials({
  lotId,
  proofHash,
  verifyPath = "/verify",
  className = "",
}) {
  const [copied, setCopied] = useState("");

  if (!lotId || !proofHash) return null;

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${verifyPath}/lot/${lotId}?proof=${proofHash}`
      : `${verifyPath}/lot/${lotId}?proof=${proofHash}`;

  function copy(value, field) {
    navigator.clipboard?.writeText(String(value));
    setCopied(field);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <Card className={className}>
      <h2 className="font-bold text-on-surface mb-1 flex items-center gap-2">
        <Icon name="qr_code_2" className="text-primary" />
        Verify this lot
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-4">
        Copy Lot ID and proof hash, or scan the QR to open verification.
      </p>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase mb-1">Lot ID</p>
          <button
            type="button"
            onClick={() => copy(lotId, "lotId")}
            className="w-full flex items-center justify-between bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant"
          >
            <span className="font-bold text-primary text-headline-sm">#{lotId}</span>
            <span className="text-label-sm font-semibold text-primary inline-flex items-center gap-1">
              <Icon name="content_copy" className="!text-base" />
              {copied === "lotId" ? "Copied" : "Copy"}
            </span>
          </button>
        </div>

        <div>
          <p className="text-label-sm text-on-surface-variant uppercase mb-1">Proof hash</p>
          <button
            type="button"
            onClick={() => copy(proofHash, "proof")}
            className="w-full text-left bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant"
          >
            <code className="text-body-sm break-all text-primary font-mono">{proofHash}</code>
            <span className="block text-label-sm font-semibold text-primary mt-2">
              {copied === "proof" ? "Copied proof hash" : "Tap to copy proof hash"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center bg-white rounded-xl border-2 border-primary p-4 mb-4">
        <QRCodeSVG
          value={verifyUrl}
          size={168}
          fgColor="#00694c"
          bgColor="#ffffff"
          level="M"
          marginSize={2}
        />
        <p className="text-label-sm text-on-surface-variant mt-3 text-center">
          Scan to verify origin on-chain
        </p>
      </div>

      <Link to={`${verifyPath}/lot/${lotId}?proof=${proofHash}`}>
        <Button variant="outline" icon={<Icon name="verified" />}>
          Open verify page
        </Button>
      </Link>
    </Card>
  );
}
