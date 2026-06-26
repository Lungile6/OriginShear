import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { useRole } from "../../context/RoleContext";
import { useFarmerLots } from "../../hooks/useFarmerLots";
import { LotStatus, LotStatusLabel, FibreTypeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, timeAgo } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";

export default function FarmerDashboard() {
  const { address } = useAccount();
  const { farmerProfile } = useRole();
  const { lots, isLoading } = useFarmerLots(address);

  const totalWeightKg = farmerProfile ? gramsToKg(farmerProfile.totalWeightGrams) : "0";
  const lotsRegistered = farmerProfile ? Number(farmerProfile.totalLotsRegistered) : 0;
  const pendingCount = lots.filter((l) => l.status === LotStatus.PENDING).length;
  const recentLots = lots.slice(0, 3);

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 py-3 flex justify-between items-center">
        <div>
          <p className="text-label-sm text-on-surface-variant">
            ID: {farmerProfile?.farmerId || "—"}
          </p>
          <p className="text-label-sm font-bold flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {farmerProfile?.district || "—"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-label-sm font-bold text-primary">LIVE LEDGER</span>
        </div>
      </div>

      <section className="px-4 flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        <StatCard label="Lots Registered" st="Loto tse ngolisitsoeng" value={lotsRegistered} />
        <StatCard label="Total Weight" st="Boima kaofela" value={totalWeightKg} unit="kg" />
        <Link
          to="/farmer/market"
          className="min-w-[200px] bg-primary text-on-primary p-4 rounded-xl shadow-sm shrink-0"
        >
          <span className="text-label-sm uppercase tracking-wide text-primary-fixed">
            Earnings / Melemo
          </span>
          <p className="text-headline-sm font-bold mt-1">View Market →</p>
        </Link>
      </section>

      {pendingCount > 0 && (
        <section className="px-4 mt-4">
          <Link
            to="/farmer/lots"
            className="bg-tertiary-fixed text-on-tertiary-fixed-variant p-4 rounded-xl flex items-center gap-3 border border-tertiary-container"
          >
            <span className="bg-tertiary-container text-on-tertiary-container rounded-full p-2 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-bold text-body-md">
                {pendingCount} lot{pendingCount > 1 ? "s" : ""} awaiting LNWMGA validation
              </p>
              <p className="text-label-sm">Loto tse {pendingCount} li letetse ho netefatsoa</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>
      )}

      <section className="px-4 mt-6">
        <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest mb-2">
          Quick Actions / Liketso tse Potlakileng
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <QuickAction to="/farmer/register" icon="register" title="Register Lot" st="Ngolisa Loto" />
          <QuickAction to="/farmer/lots" icon="lots" title="My Lots" st="Loto tsa ka" />
          <QuickAction to="/farmer/lots" icon="qr" title="QR Proof" st="Bopaki ba QR" />
          <QuickAction to="/farmer/market" icon="market" title="Market" st="Mmaraka" />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex justify-between items-center px-4 mb-2">
          <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest">
            Recent Activity
          </h2>
          <Link to="/farmer/lots" className="text-primary font-bold text-label-sm">
            View All
          </Link>
        </div>
        <div className="px-4 space-y-3">
          {isLoading && <p className="text-body-sm text-on-surface-variant">Loading lots…</p>}
          {!isLoading && recentLots.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              No lots registered yet. Tap "Register Lot" to get started.
            </p>
          )}
          {recentLots.map((lot) => (
            <Link
              key={lot.lotId.toString()}
              to={`/farmer/lots/${lot.lotId}`}
              className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex justify-between items-center shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-surface-container p-2 rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
                    <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-on-surface">Lot #{lot.lotId.toString()}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {FibreTypeLabel[lot.fibreType]} · {gramsToKg(lot.weightGrams)}kg
                  </p>
                </div>
              </div>
              <div className="text-right">
                <StatusChip status={LotStatusLabel[lot.status]} />
                <p className="text-[10px] text-on-surface-variant mt-1">{timeAgo(lot.registeredAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/farmer/register"
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center"
        aria-label="Register new lot"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </Link>
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
  register: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" strokeLinejoin="round" />
      <path d="M14 3v6h6M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  ),
  lots: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="4" y="7" width="16" height="13" rx="1.5" />
      <path d="M4 11h16M9 4h6l1.5 3h-9z" strokeLinejoin="round" />
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
  market: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M3 17 9 9l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function QuickAction({ to, icon, title, st }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-start p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm active:scale-95 transition-transform h-24 justify-between"
    >
      <span className="text-primary">{QUICK_ICONS[icon]}</span>
      <div className="text-left">
        <p className="font-bold text-on-surface text-body-sm">{title}</p>
        <p className="text-[10px] text-on-surface-variant uppercase">{st}</p>
      </div>
    </Link>
  );
}
