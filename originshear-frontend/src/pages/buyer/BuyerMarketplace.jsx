import { useMemo } from "react";
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
import { useState } from "react";

function matchesFilters(item, fibreFilter, gradeFilter, originFilter) {
  if (fibreFilter !== "all" && Number(item.fibreType) !== Number(fibreFilter)) return false;
  if (gradeFilter !== "all" && Number(item.grade) !== Number(gradeFilter)) return false;
  if (originFilter.trim()) {
    const query = originFilter.trim().toLowerCase();
    if (!item.gpsZone?.toLowerCase().includes(query)) return false;
  }
  return true;
}

function ListingCard({ item }) {
  const unlisted = Boolean(item.unlisted);
  return (
    <Link
      to={`/buyer/lots/${item.lotId.toString()}`}
      className="block active:scale-[0.99] transition-transform"
    >
      <Card role="buyer">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-label-sm text-on-surface-variant flex items-center gap-2">
              Lot #{item.lotId.toString()}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  unlisted
                    ? "bg-role-farmer/15 text-role-farmer"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {unlisted ? "Verified" : "For sale"}
              </span>
            </p>
            <p className="font-bold text-body-lg">
              {FibreTypeLabel[item.fibreType]} · Grade {GradeLabel[item.grade]}
            </p>
          </div>
          <div className="text-right">
            {unlisted ? (
              <>
                <p className="font-bold text-body-md text-on-surface-variant">Awaiting price</p>
                <p className="text-[10px] text-on-surface-variant">Farmer has not listed yet</p>
              </>
            ) : (
              <>
                <p className="font-bold text-headline-sm text-primary">
                  {formatCUSD(item.askPriceWei)} cUSD
                </p>
                <p className="text-[10px] text-on-surface-variant">≈ {cusdToLSL(item.askPriceWei)} LSL</p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-body-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon name="scale" className="!text-sm" />
            {gramsToKg(item.weightGrams)} kg
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="location_on" className="!text-sm" />
            {item.gpsZone || "—"}
          </span>
          <span>Farmer: {shorten(item.farmer)}</span>
        </div>
      </Card>
    </Link>
  );
}

export default function BuyerMarketplace() {
  const { listings, verifiedUnlisted, isLoading, error, refetch } = useMarketListings();
  const [fibreFilter, setFibreFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("");

  const forSale = useMemo(
    () => listings.filter((item) => matchesFilters(item, fibreFilter, gradeFilter, originFilter)),
    [listings, fibreFilter, gradeFilter, originFilter]
  );

  const verified = useMemo(
    () =>
      verifiedUnlisted.filter((item) => matchesFilters(item, fibreFilter, gradeFilter, originFilter)),
    [verifiedUnlisted, fibreFilter, gradeFilter, originFilter]
  );

  const empty = !isLoading && forSale.length === 0 && verified.length === 0;

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <PageHeader
          en="Marketplace"
          st="Mmaraka"
          subtitle="Browse LNWMGA-verified lots — buy when a farmer lists a price"
          action={
            <button type="button" onClick={() => refetch()} className="text-primary text-label-sm font-bold">
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
              <select
                value={fibreFilter}
                onChange={(e) => setFibreFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">All / Tsohle</option>
                <option value="0">Wool / Wolo</option>
                <option value="1">Mohair / Mohair</option>
              </select>
            </FormField>
            <FormField label="Grade">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className={selectClassName}
              >
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
          <p className="text-body-sm text-error mb-3">{error}</p>
        )}

        {isLoading && (
          <div className="space-y-stack-md">
            <LotCardSkeleton />
            <LotCardSkeleton />
          </div>
        )}

        {empty && (
          <p className="text-body-sm text-on-surface-variant">
            No verified lots on-chain yet. After a validator approves a harvest, it appears here.
            Farmers list a price from Sell Your Lot to make it buyable.
          </p>
        )}

        {!isLoading && forSale.length > 0 && (
          <section className="mb-stack-lg">
            <h2 className="text-label-lg text-primary uppercase tracking-wider mb-stack-sm">
              For sale
            </h2>
            <div className="space-y-stack-md">
              {forSale.map((item) => (
                <ListingCard key={`sale-${item.offerId.toString()}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && verified.length > 0 && (
          <section>
            <h2 className="text-label-lg text-role-farmer uppercase tracking-wider mb-stack-sm">
              Verified · awaiting listing
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-stack-sm">
              LNWMGA-validated lots. The farmer still needs to set a price on Sell Your Lot.
            </p>
            <div className="space-y-stack-md">
              {verified.map((item) => (
                <ListingCard key={`verified-${item.lotId.toString()}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
