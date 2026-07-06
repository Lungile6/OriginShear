import { useState } from "react";
import { useParams } from "react-router-dom";
import { useChainId, useReadContract } from "wagmi";
import { QRCodeSVG } from "qrcode.react";
import AppLayout from "../../layouts/AppLayout";
import { HARVEST_LEDGER_ABI, FibreTypeLabel, GradeLabel, LotStatus } from "../../contracts/HarvestLedger";
import { getContractAddresses } from "../../contracts/addresses";
import { gramsToKg, shorten } from "../../lib/utils";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { LotCardSkeleton } from "../../components/ui/Skeleton";

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
        <div className="px-margin-mobile pt-stack-lg max-w-md mx-auto">
          <LotCardSkeleton />
        </div>
      </AppLayout>
    );
  }

  const verifyUrl = `${window.location.origin}/buyer/verify/lot/${lotId}?proof=${lot.proofOfOrigin}`;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-md mx-auto flex flex-col items-center">
        <Card className="w-full mb-stack-md">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                Lot Identifier
              </span>
              <h2 className="text-headline-sm font-bold text-primary">#{lotId}</h2>
            </div>
            {lot.status === LotStatus.VALIDATED && (
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-sm font-semibold flex items-center gap-1">
                <Icon name="verified" filled size={14} />
                VALIDATED BY LNWMGA
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Field label="Material" value={FibreTypeLabel[lot.fibreType]} />
            <Field label="Grade" value={`Grade ${GradeLabel[lot.grade]}`} />
            <Field label="Weight" value={`${gramsToKg(lot.weightGrams)}kg`} />
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2">
            <Icon name="location_on" className="text-on-surface-variant" />
            <span className="text-body-sm">{lot.gpsZone}, Lesotho</span>
          </div>
        </Card>

        <Card className="w-full flex flex-col items-center p-stack-lg mb-stack-md">
          <div className="bg-white p-4 border-2 border-primary rounded-2xl mb-4">
            <QRCodeSVG
              value={verifyUrl}
              size={192}
              fgColor="#00694c"
              bgColor="#ffffff"
              level="M"
              marginSize={2}
            />
          </div>
          <label className="text-label-sm text-on-surface-variant block mb-1 w-full text-center">
            Blockchain Proof Hash
          </label>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full bg-surface-container flex items-center justify-between px-3 py-2 rounded-lg border border-outline-variant group"
          >
            <code className="text-body-sm text-primary font-mono truncate mr-2 select-all">
              {shorten(lot.proofOfOrigin, 10, 6)}
            </code>
            <Icon name="content_copy" size={18} className="text-primary shrink-0" />
          </button>
          {copied && <p className="text-label-sm text-primary mt-1">Copied!</p>}
        </Card>

        <div className="w-full px-2 mb-stack-lg text-center">
          <p className="text-body-md font-bold text-on-surface">
            Show this QR at the export checkpoint for instant verification
          </p>
          <p className="text-body-sm text-on-surface-variant italic">Bontša QR ena bokaholimo ho ahloloa</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => downloadSvgAsPng(`originshear-lot-${lotId}`)}
            icon={<Icon name="download" />}
          >
            Download QR
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigator.share?.({ url: verifyUrl, title: `ORIGINSHEAR Lot #${lotId}` })}
            icon={<Icon name="share" />}
            className="border-2 border-primary text-primary"
          >
            Share
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className="text-body-md font-bold">{value}</span>
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
