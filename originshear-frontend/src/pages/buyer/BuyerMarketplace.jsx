import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { useMarketListings } from "../../hooks/useMarketListings";
import { FibreTypeLabel, GradeLabel } from "../../contracts/HarvestLedger";
import { formatCUSD, cusdToLSL, gramsToKg, shorten } from "../../lib/utils";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { FormField, inputClassName, selectClassName } from "../../components/ui/FormField";
import { LotCardSkeleton } from "../../components/ui/Skeleton";

export default function BuyerMarketplace() {
  const { listings, isLoading, error, refetch } = useMarketListings();
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
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <PageHeader
          en="Marketplace"
          st="Mmaraka"
          subtitle="Browse validated lots listed for sale"
          action={
            <button onClick={() => refetch()} className="text-primary text-label-sm font-bold">
              Refresh
            </button>
          }
        />

        <Card role="buyer" className="mb-stack-md space-y-3">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
            <Icon name="filter_list" className="!text-base" />
            Filters / Lihloekiso
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fibre Type">
              <select value={fibreFilter} onChange={(e) => setFibreFilter(e.target.value)} className={selectClassName}>
                <option value="all">All / Tsohle</option>
                <option value="0">Wool / Wolo</option>
                <option value="1">Mohair / Mohair</option>
              </select>
            </FormField>
            <FormField label="Grade">
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={selectClassName}>
                <option value="all">All / Tsohle</option>
                <option value="0">Grade A</option>
                <option value="1">Grade B</option>
                <option value="2">Grade C</option>
              </select>
            </FormField>
          </div>
          <FormField label="Origin / Sebaka">
            <input
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              placeholder="e.g. Quthing, Maseru"
              className={inputClassName}
            />
          </FormField>
        </Card>

        {error && (
          <p className="text-body-sm text-error mb-3">
            {error}. Ensure the API is running at {import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}.
          </p>
        )}

        {isLoading && (
          <div className="space-y-stack-md">
            <LotCardSkeleton />
            <LotCardSkeleton />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            No lots match your filters. Check back when farmers list validated harvests.
          </p>
        )}

        <div className="space-y-stack-md">
          {filtered.map((item) => (
            <Link
              key={item.offerId.toString()}
              to={`/buyer/lots/${item.lotId.toString()}`}
              className="block active:scale-[0.99] transition-transform"
            >
              <Card role="buyer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Lot #{item.lotId.toString()}</p>
                    <p className="font-bold text-body-lg">
                      {FibreTypeLabel[item.fibreType]} · Grade {GradeLabel[item.grade]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-headline-sm text-primary">{formatCUSD(item.askPriceWei)} cUSD</p>
                    <p className="text-[10px] text-on-surface-variant">≈ {cusdToLSL(item.askPriceWei)} LSL</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-body-sm text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="scale" className="!text-sm" />
                    {gramsToKg(item.weightGrams)} kg
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="location_on" className="!text-sm" />
                    {item.gpsZone}
                  </span>
                  <span>Farmer: {shorten(item.farmer)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
