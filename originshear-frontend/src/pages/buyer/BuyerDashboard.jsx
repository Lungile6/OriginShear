import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { useCusdBalance } from "../../hooks/useCusdBalance";
import { usePaymentHistory } from "../../hooks/usePaymentHistory";
import { formatCUSD, cusdToLSL, shorten } from "../../lib/utils";
import StatCard from "../../components/ui/StatCard";
import QuickAction from "../../components/ui/QuickAction";
import DashboardHeader from "../../components/ui/DashboardHeader";
import BilingualText from "../../components/ui/BilingualText";
import Card from "../../components/ui/Card";
import { LotCardSkeleton, StatRailSkeleton } from "../../components/ui/Skeleton";

export default function BuyerDashboard() {
  const { address } = useAccount();
  const { data: balance, isLoading: loadingBalance } = useCusdBalance(address);
  const { payments, isLoading: loadingHistory } = usePaymentHistory(address);

  const purchases = useMemo(
    () => payments.filter((p) => p.buyer?.toLowerCase() === address?.toLowerCase()),
    [payments, address]
  );

  const purchaseCount = purchases.length;
  const totalSpentWei = purchases.reduce(
    (acc, curr) => acc + BigInt(curr.netAmount || 0n) + BigInt(curr.fee || 0n),
    0n
  );
  const recentPurchases = purchases.slice(0, 3);
  const loadingStats = loadingBalance || loadingHistory;

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <DashboardHeader
        role="BUYER"
        subtitle="Buyer / Verifier Portal"
        detail="Registered Buyer"
      />

      <section className="px-4 flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {loadingStats ? (
          <StatRailSkeleton count={3} />
        ) : (
          <>
            <div className="min-w-[170px] bg-primary text-on-primary p-4 rounded-xl shadow-sm shrink-0">
              <span className="text-label-sm uppercase tracking-wide text-primary-fixed">cUSD Balance</span>
              <p className="text-headline-sm font-bold mt-1">{formatCUSD(balance)} cUSD</p>
              <p className="text-[10px] text-primary-fixed mt-1">≈ {cusdToLSL(balance)} LSL</p>
            </div>
            <StatCard label="Purchases" st="Loto tse rekileng" value={purchaseCount} />
            <StatCard label="Total Spent" st="Tefiso kaofela" value={formatCUSD(totalSpentWei)} unit="cUSD" />
          </>
        )}
      </section>

      <section className="px-4 mt-6">
        <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest mb-2">
          <BilingualText en="Quick Actions" st="Liketso tse Potlakileng" size="label-lg" />
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction compact to="/buyer/marketplace" icon="market" title="Marketplace" st="Mmaraka" />
          <QuickAction compact to="/buyer/purchases" icon="history" title="Purchases" st="Litefiso" />
          <QuickAction compact to="/news" icon="news" title="Government News" st="Litaba tsa Mmuso" />
          <QuickAction compact to="/buyer/verify" icon="qr" title="Verify Lot" st="Netefatsa" />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex justify-between items-center px-4 mb-2">
          <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest">
            Recent Purchases / Litheko tsa Morao-rao
          </h2>
          <Link to="/buyer/purchases" className="text-primary font-bold text-label-sm">
            View All
          </Link>
        </div>
        <div className="px-4 space-y-3">
          {loadingHistory && (
            <>
              <LotCardSkeleton />
              <LotCardSkeleton />
            </>
          )}
          {!loadingHistory && recentPurchases.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              No purchases made yet. Visit the Marketplace to browse listed wool lots.
            </p>
          )}
          {recentPurchases.map((p) => {
            const grossWei = BigInt(p.netAmount || 0n) + BigInt(p.fee || 0n);
            return (
              <Link key={p.offerId.toString()} to={`/buyer/lots/${p.lotId}`}>
                <Card role="buyer" className="flex justify-between items-center active:scale-[0.99] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="bg-surface-container p-2 rounded-lg text-primary">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">Lot #{p.lotId.toString()}</p>
                      <p className="text-body-sm text-on-surface-variant">Farmer: {shorten(p.farmer)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">-{formatCUSD(grossWei)} cUSD</p>
                    <p className="text-[10px] text-on-surface-variant">
                      Net: {formatCUSD(p.netAmount)} · Fee: {formatCUSD(p.fee)}
                    </p>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold rounded-full px-2 py-0.5 mt-1 inline-block">
                      Completed
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
}
