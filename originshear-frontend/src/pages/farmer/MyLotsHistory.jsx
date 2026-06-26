import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { useFarmerLots } from "../../hooks/useFarmerLots";
import { LotStatus, LotStatusLabel, FibreType, FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, shorten } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";

const TYPE_FILTERS = [
  { key: "all", label: "All Types" },
  { key: FibreType.WOOL, label: "Wool (Boyea)" },
  { key: FibreType.MOHAIR, label: "Mohair (Boya ba Poli)" },
];

export default function MyLotsHistory() {
  const { address } = useAccount();
  const { lots, isLoading } = useFarmerLots(address);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return lots.filter((lot) => {
      if (typeFilter !== "all" && lot.fibreType !== typeFilter) return false;
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
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-headline-md font-bold">My Lots (Loto)</h1>
        <p className="text-body-sm text-on-surface-variant mb-4">
          View and manage your registered fibre transactions.
        </p>

        <div className="relative mb-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Lot ID or Location…"
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-4 text-body-md focus:border-primary focus:border-2 outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`shrink-0 h-9 px-4 rounded-full text-label-sm font-semibold border flex items-center gap-1.5 ${
                typeFilter === f.key
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-on-surface-variant"
              }`}
            >
              {f.key === "all" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
                </svg>
              )}
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-body-sm text-on-surface-variant">Loading lots…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No lots match your filters.</p>
        )}

        <div className="space-y-4">
          {filtered.map((lot) => (
            <LotCard key={lot.lotId.toString()} lot={lot} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function LotCard({ lot }) {
  const status = lot.status;
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase">Lot ID</p>
          <p className="font-bold text-headline-sm">#{lot.lotId.toString()}</p>
        </div>
        <StatusChip status={LotStatusLabel[status]} label={`${LotStatusLabel[status]}${status === LotStatus.VALIDATED ? " ✓" : status === LotStatus.REJECTED ? " ✗" : ""}`} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Row label="Fibre / Grade" value={`${FibreTypeLabel[lot.fibreType]} Grade ${GradeLabel[lot.grade]}`} />
        <Row label="Weight (Boima)" value={`${gramsToKg(lot.weightGrams)}kg`} />
        <Row label="Origin (Sebaka)" value={lot.gpsZone} />
      </div>

      <p className="text-[10px] text-on-surface-variant font-mono mb-3">
        HASH: {shorten(lot.proofOfOrigin, 6, 6)}
      </p>

      {status === LotStatus.VALIDATED && (
        <Link
          to={`/farmer/lots/${lot.lotId}/qr`}
          className="w-full h-11 rounded-lg bg-primary text-on-primary font-semibold flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Generate QR
        </Link>
      )}
      {status === LotStatus.PENDING && (
        <div className="w-full h-11 rounded-lg bg-surface-container text-on-surface-variant font-semibold flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" strokeLinecap="round" />
          </svg>
          Awaiting Validation
        </div>
      )}
      {status === LotStatus.REJECTED && (
        <button className="w-full h-11 rounded-lg border border-error text-error font-semibold flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Appeal Rejection
        </button>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-bold text-body-sm text-on-surface">{value}</p>
    </div>
  );
}
