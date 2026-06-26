import { useState } from "react";
import { useParams } from "react-router-dom";
import { useChainId, useReadContract } from "wagmi";
import { QRCodeSVG } from "qrcode.react";
import AppLayout from "../../layouts/AppLayout";
import { HARVEST_LEDGER_ABI, FibreTypeLabel, GradeLabel, LotStatus } from "../../contracts/HarvestLedger";
import { getContractAddresses } from "../../contracts/addresses";
import { gramsToKg, shorten } from "../../lib/utils";

export default function QRProofOfOrigin() {
  const { lotId } = useParams();
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const [copied, setCopied] = useState(false);

  const { data: lot, isLoading } = useReadContract({
    address: addresses?.harvestLedger,
    abi: HARVEST_LEDGER_ABI,
    functionName: "getLot",
    args: [BigInt(lotId)],
    query: { enabled: Boolean(addresses && lotId) },
  });

  function handleCopy() {
    if (!lot) return;
    navigator.clipboard?.writeText(lot.proofOfOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading || !lot) {
    return (
      <AppLayout role="FARMER" title="ORIGINSHEAR">
        <p className="px-4 py-6 text-body-sm text-on-surface-variant">Loading lot…</p>
      </AppLayout>
    );
  }

  // Public verification URL — encoded into the QR so any phone camera
  // (not just this app) can resolve it to the public_lot_verification page.
  const verifyUrl = `${window.location.origin}/verify/lot/${lotId}?proof=${lot.proofOfOrigin}`;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase">Lot Identifier</p>
              <p className="text-headline-md font-bold text-primary">#{lotId}</p>
            </div>
            {lot.status === LotStatus.VALIDATED && (
              <span className="inline-flex items-center gap-1 bg-primary text-on-primary rounded-full px-3 py-1 text-label-sm font-semibold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Validated by LNWMGA
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="Material" value={FibreTypeLabel[lot.fibreType]} />
            <Field label="Grade" value={`Grade ${GradeLabel[lot.grade]}`} />
            <Field label="Weight" value={`${gramsToKg(lot.weightGrams)}kg`} />
          </div>
          <hr className="border-outline-variant mb-3" />
          <p className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {lot.gpsZone}, Lesotho
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col items-center mb-4">
          <div className="p-3 bg-white rounded-lg">
            <QRCodeSVG
              value={verifyUrl}
              size={220}
              fgColor="#00694c"
              bgColor="#ffffff"
              level="M"
              marginSize={2}
            />
          </div>
          <p className="text-label-sm text-on-surface-variant uppercase mt-4 mb-1">
            Blockchain Proof Hash
          </p>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between bg-surface-container rounded-lg px-3 py-2.5"
          >
            <code className="text-body-sm">{shorten(lot.proofOfOrigin, 10, 6)}</code>
            <span className="text-primary text-label-sm font-semibold">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        <p className="text-center font-semibold text-body-md mb-1">
          Show this QR at the export checkpoint for instant verification
        </p>
        <p className="text-center italic text-body-sm text-on-surface-variant mb-6">
          Bontša QR ena bokaholimo ho ahloloa
        </p>

        <button
          onClick={() => downloadSvgAsPng(`originshear-lot-${lotId}`)}
          className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold mb-3 flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download QR
        </button>
        <button
          onClick={() => navigator.share?.({ url: verifyUrl, title: `ORIGINSHEAR Lot #${lotId}` })}
          className="w-full h-12 rounded-lg border border-outline-variant text-on-surface font-semibold flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M8.2 10.8 15.8 7M8.2 13.2 15.8 17" />
          </svg>
          Share
        </button>
      </div>
    </AppLayout>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-bold text-body-md">{value}</p>
    </div>
  );
}

function downloadSvgAsPng(filename) {
  const svg = document.querySelector("svg[role='img'], svg");
  if (!svg) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const image64 = `data:image/svg+xml;base64,${svg64}`;
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = image64;
}
