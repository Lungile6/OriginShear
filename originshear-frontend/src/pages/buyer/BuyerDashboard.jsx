import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { useCusdBalance } from "../../hooks/useCusdBalance";
import { usePaymentHistory } from "../../hooks/usePaymentHistory";
import { formatCUSD, cusdToLSL, shorten } from "../../lib/utils";
import BilingualText from "../../components/ui/BilingualText";

export default function BuyerDashboard() {
  const { address } = useAccount();
  const { data: balance, isLoading: loadingBalance } = useCusdBalance(address);
  const { payments, isLoading: loadingHistory } = usePaymentHistory(address);

  const purchases = useMemo(
    () =>
      payments.filter(
        (p) => p.buyer?.toLowerCase() === address?.toLowerCase()
      ),
    [payments, address]
  );

  const purchaseCount = purchases.length;
  const totalSpentWei = purchases.reduce(
    (acc, curr) => acc + BigInt(curr.netAmount || 0n) + BigInt(curr.fee || 0n),
    0n
  );
  const recentPurchases = purchases.slice(0, 3);

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <div className="px-4 py-3 flex justify-between items-center">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Buyer / Verifier Portal
          </p>
          <p className="text-label-sm font-bold flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-primary">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
            </svg>
            Registered Buyer
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-label-sm font-bold text-primary">LIVE LEDGER</span>
        </div>
      </div>

      <section className="px-4 flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        <div className="min-w-[170px] bg-primary text-on-primary p-4 rounded-xl shadow-sm shrink-0">
          <span className="text-label-sm uppercase tracking-wide text-primary-fixed">
            cUSD Balance
          </span>
          <p className="text-headline-sm font-bold mt-1">
            {loadingBalance ? "..." : `${formatCUSD(balance)} cUSD`}
          </p>
          <p className="text-[10px] text-primary-fixed mt-1">
            ≈ {cusdToLSL(balance)} LSL
          </p>
        </div>
        <StatCard label="Purchases" st="Loto tse rekileng" value={purchaseCount} />
        <StatCard
          label="Total Spent"
          st="Tefiso kaofela"
          value={formatCUSD(totalSpentWei)}
          unit="cUSD"
        />
      </section>

      <section className="px-4 mt-6">
        <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest mb-2">
          <BilingualText en="Quick Actions" st="Liketso tse Potlakileng" size="label-lg" />
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction to="/buyer/marketplace" icon="market" title="Marketplace" st="Mmaraka" />
          <QuickAction to="/buyer/purchases" icon="history" title="Purchases" st="Litefiso" />
          <QuickAction to="/news" icon="news" title="Government News" st="Litaba tsa Mmuso" />
          <QuickAction to="/buyer/verify" icon="qr" title="Verify Lot" st="Netefatsa" />
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
          {loadingHistory && <p className="text-body-sm text-on-surface-variant">Loading purchases…</p>}
          {!loadingHistory && recentPurchases.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              No purchases made yet. Visit the Marketplace to browse listed wool lots.
            </p>
          )}
          {recentPurchases.map((p) => {
            const grossWei = BigInt(p.netAmount || 0n) + BigInt(p.fee || 0n);
            return (
              <Link
                key={p.offerId.toString()}
                to={`/buyer/lots/${p.lotId}`}
                className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex justify-between items-center shadow-sm"
              >
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
                    <p className="text-body-sm text-on-surface-variant">
                      Farmer: {shorten(p.farmer)}
                    </p>
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
              </Link>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
}

function StatCard({ label, st, value, unit }) {
  return (
    <div className="min-w-[150px] bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm shrink-0">
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
      <div className="text-headline-md font-bold text-on-surface mt-1">
        {value} {unit && <span className="text-body-sm">{unit}</span>}
      </div>
      {st && <div className="text-label-sm text-primary mt-1">{st}</div>}
    </div>
  );
}

const QUICK_ICONS = {
  market: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M3 17 9 9l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M3 11v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3M3 11l13-6v14L3 13" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M16 9a3 3 0 0 1 0 6" strokeLinecap="round" />
    </svg>
  ),
  qr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3z" />
    </svg>
  ),
};

function QuickAction({ to, icon, title, st }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-start p-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm active:scale-95 transition-transform h-24 justify-between"
    >
      <span className="text-primary">{QUICK_ICONS[icon]}</span>
      <div className="text-left">
        <p className="font-bold text-on-surface text-[12px] leading-tight">{title}</p>
        <p className="text-[9px] text-on-surface-variant uppercase">{st}</p>
      </div>
    </Link>
  );
}
