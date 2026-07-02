import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { useMarketListings } from "../../hooks/useMarketListings";
import { FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { formatCUSD, cusdToLSL, gramsToKg, shorten } from "../../lib/utils";
import BilingualText from "../../components/ui/BilingualText";

export default function BuyerMarketplace() {
  const { listings, isLoading, refetch } = useMarketListings();
  const [fibreFilter, setFibreFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("");

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      if (fibreFilter !== "all" && Number(item.fibreType) !== Number(fibreFilter)) return false;
      if (gradeFilter !== "all" && Number(item.grade) !== Number(gradeFilter)) return false;
      if (originFilter.trim()) {
        const query = originFilter.trim().toLowerCase();
        if (!item.gpsZone?.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [listings, fibreFilter, gradeFilter, originFilter]);

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-headline-md font-bold">
              <BilingualText en="Marketplace" st="Mmaraka" size="headline-md" />
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Browse validated lots listed for sale
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-primary text-label-sm font-bold"
          >
            Refresh
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 mb-4 space-y-3">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Filters / Lihloekiso
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-label-sm font-semibold mb-1 block">Fibre Type</span>
              <select
                value={fibreFilter}
                onChange={(e) => setFibreFilter(e.target.value)}
                className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container px-3 text-body-sm"
              >
                <option value="all">All / Tsohle</option>
                <option value="0">Wool / Wolo</option>
                <option value="1">Mohair / Mohair</option>
              </select>
            </label>
            <label className="block">
              <span className="text-label-sm font-semibold mb-1 block">Grade</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container px-3 text-body-sm"
              >
                <option value="all">All / Tsohle</option>
                <option value="0">Grade A</option>
                <option value="1">Grade B</option>
                <option value="2">Grade C</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-label-sm font-semibold mb-1 block">Origin / Sebaka</span>
            <input
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              placeholder="e.g. Quthing, Maseru"
              className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container px-3 text-body-sm"
            />
          </label>
        </div>

        {isLoading && (
          <p className="text-body-sm text-on-surface-variant">Loading listings…</p>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            No lots match your filters. Check back when farmers list validated harvests.
          </p>
        )}

        <div className="space-y-3">
          {filtered.map((item) => (
            <Link
              key={item.offerId.toString()}
              to={`/buyer/lots/${item.lotId.toString()}`}
              className="block bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 active:scale-[0.99] transition-transform"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-label-sm text-on-surface-variant">
                    Lot #{item.lotId.toString()}
                  </p>
                  <p className="font-bold text-body-lg">
                    {FibreTypeLabel[item.fibreType]} · Grade {GradeLabel[item.grade]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-headline-sm text-primary">
                    {formatCUSD(item.askPriceWei)} cUSD
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    ≈ {cusdToLSL(item.askPriceWei)} LSL
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-body-sm text-on-surface-variant">
                <span>{gramsToKg(item.weightGrams)} kg</span>
                <span>{item.gpsZone}</span>
                <span>Farmer: {shorten(item.farmer)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
