import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { useFarmerLots } from "../../hooks/useFarmerLots";
import { LotStatus, LotStatusLabel, FibreType, FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, shorten } from "../../lib/utils";
import { SUPPORT } from "../../lib/support";
import { toGatewayUrl } from "../../lib/ipfs";
import StatusChip from "../../components/ui/StatusChip";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { LotCardSkeleton } from "../../components/ui/Skeleton";

const TYPE_FILTERS = [
  { key: "all", label: "All Types" },
  { key: FibreType.WOOL, label: "Wool (Boyea)" },
  { key: FibreType.MOHAIR, label: "Mohair (Mohlaba)" },
  { key: "pending", label: "Pending" },
];

export default function MyLotsHistory() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { lots, isLoading } = useFarmerLots(address);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return lots.filter((lot) => {
      if (typeFilter === "pending" && lot.status !== LotStatus.PENDING) return false;
      if (typeFilter !== "all" && typeFilter !== "pending" && lot.fibreType !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesId = lot.lotId.toString().includes(q);
        const matchesZone = lot.gpsZone.toLowerCase().includes(q);
        if (!matchesId && !matchesZone) return false;
      }
      return true;
    });
  }, [lots, typeFilter, search]);

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-6 max-w-[1024px] mx-auto">
        <div className="mb-stack-lg">
          <h1 className="text-headline-md font-bold text-on-surface">My Lots (Loto)</h1>
          <p className="text-body-sm text-on-surface-variant">
            View and manage your registered fibre transactions.
          </p>
        </div>

        <div className="flex flex-col gap-stack-sm mb-stack-lg">
          <div className="relative w-full">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Lot ID or Location..."
              className="w-full pl-12 pr-4 h-touch-target-min bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTypeFilter(f.key)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-label-lg border transition-colors ${
                  typeFilter === f.key
                    ? "bg-primary-container text-on-primary-container border-outline-variant"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {f.key === "all" && <Icon name="filter_list" size={18} />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <LotCardSkeleton />
            <LotCardSkeleton />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center text-center py-12 px-4">
            <Icon name="inventory_2" size={48} className="text-on-surface-variant mb-4" />
            <h3 className="text-headline-md font-bold text-on-surface">No Lots Registered Yet</h3>
            <p className="text-body-md text-on-surface-variant max-w-xs mt-2">
              Start by registering your first wool or mohair harvest to see it on the ledger.
            </p>
            <Button fullWidth={false} className="mt-8 px-8" onClick={() => navigate("/farmer/register")}>
              Register New Lot (Ngolisa)
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-stack-md">
          {filtered.map((lot) => (
            <LotCard key={lot.lotId.toString()} lot={lot} onQr={() => navigate(`/farmer/lots/${lot.lotId}/qr`)} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function LotCard({ lot, onQr }) {
  const status = lot.status;

  return (
    <Card role="farmer" className="hover:border-primary transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Lot ID</span>
          <h3 className="text-headline-sm font-bold">#{lot.lotId.toString()}</h3>
        </div>
        <StatusChip
          status={LotStatusLabel[status]}
          label={`${LotStatusLabel[status]}${status === LotStatus.VALIDATED ? " ✓" : status === LotStatus.REJECTED ? " ✗" : ""}`}
        />
      </div>

      <div className="space-y-3 mb-4">
        <Row label="Fibre / Grade" value={`${FibreTypeLabel[lot.fibreType]} Grade ${GradeLabel[lot.grade]}`} />
        <Row label="Weight (Boima)" value={`${gramsToKg(lot.weightGrams)}kg`} />
        <Row label="Origin (Sebaka)" value={lot.gpsZone} />
        <div className="pt-2 border-t border-outline-variant">
          <span className="text-[10px] font-mono text-on-surface-variant block truncate">
            {status === LotStatus.PENDING
              ? "Syncing with ledger..."
              : `HASH: ${shorten(lot.proofOfOrigin, 6, 6)}`}
          </span>
        </div>
      </div>

      {lot.metadataURI && (
        <a
          href={toGatewayUrl(lot.metadataURI)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-label-sm text-primary font-semibold mb-3 underline"
        >
          View Metadata (IPFS)
        </a>
      )}

      {status === LotStatus.VALIDATED && (
        <Button onClick={onQr} icon={<Icon name="qr_code_2" />}>
          Generate QR
        </Button>
      )}
      {status === LotStatus.PENDING && (
        <div className="w-full h-touch-target-min bg-surface-container-highest text-on-surface-variant opacity-60 rounded-xl font-label-lg flex items-center justify-center gap-2 cursor-not-allowed">
          <Icon name="pending" />
          Awaiting Validation
        </div>
      )}
      {status === LotStatus.REJECTED && (
        <a href={`mailto:${SUPPORT.disputesEmail}?subject=${encodeURIComponent(`Appeal for Lot #${lot.lotId}`)}`}>
          <Button variant="outline-error" icon={<Icon name="edit_note" />}>
            Appeal Rejection
          </Button>
        </a>
      )}
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
