import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { LotStatus, LotStatusLabel, FibreTypeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, timeAgo, shorten } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";
import BilingualText from "../../components/ui/BilingualText";

export default function ValidatorDashboard() {
  const { allLots, pendingLots, isLoading } = useLotQueue();

  const pendingCount = pendingLots.length;
  const decidedLots = allLots.filter(
    (l) => l.status === LotStatus.VALIDATED || l.status === LotStatus.REJECTED
  );
  const approvedCount = decidedLots.filter((l) => l.status === LotStatus.VALIDATED).length;
  const rejectedCount = decidedLots.filter((l) => l.status === LotStatus.REJECTED).length;
  const recentAudits = decidedLots.slice(0, 3);

  return (
    <AppLayout role="VALIDATOR" title="ORIGINSHEAR">
      <div className="px-4 py-3 flex justify-between items-center">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            LNWMGA Portal
          </p>
          <p className="text-label-sm font-bold flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-role-validator" />
            District Office (Quthing)
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-label-sm font-bold text-primary">LIVE LEDGER</span>
        </div>
      </div>

      <section className="px-4 flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        <StatCard
          label="Pending Queue"
          st="Loto tse letetseng"
          value={pendingCount}
          highlight={pendingCount > 0}
        />
        <StatCard
          label="Approved Lots"
          st="Loto tse lumetsoeng"
          value={approvedCount}
        />
        <StatCard
          label="Rejected Lots"
          st="Loto tse hanetsoeng"
          value={rejectedCount}
        />
      </section>

      <section className="px-4 mt-6">
        <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest mb-2">
          <BilingualText en="Quick Actions" st="Liketso tse Potlakileng" size="label-lg" />
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <QuickAction
            to="/validator/queue"
            icon="queue"
            title="Validation Queue"
            st="Loto tse Letetseng"
          />
          <QuickAction
            to="/validator/audit"
            icon="audit"
            title="Audit Log"
            st="Tlaleho ea Tlhahlobo"
          />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex justify-between items-center px-4 mb-2">
          <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest">
            Recent Audit Decisions / Liketo tsa morao-rao
          </h2>
          <Link to="/validator/audit" className="text-primary font-bold text-label-sm">
            View All
          </Link>
        </div>
        <div className="px-4 space-y-3">
          {isLoading && <p className="text-body-sm text-on-surface-variant">Loading audits…</p>}
          {!isLoading && recentAudits.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              No audit decisions recorded yet. Check the queue for pending lots.
            </p>
          )}
          {recentAudits.map((lot) => (
            <div
              key={lot.lotId.toString()}
              className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex justify-between items-center shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-surface-container p-2 rounded-lg text-role-validator">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
                    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-on-surface">Lot #{lot.lotId.toString()}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {FibreTypeLabel[lot.fibreType]} · {gramsToKg(lot.weightGrams)}kg · {shorten(lot.farmer)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <StatusChip status={LotStatusLabel[lot.status]} />
                <p className="text-[10px] text-on-surface-variant mt-1">{timeAgo(lot.validatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

function StatCard({ label, st, value, highlight = false }) {
  return (
    <div className={`min-w-[150px] bg-surface-container-lowest border p-4 rounded-xl shadow-sm shrink-0 ${highlight ? "border-role-validator/40" : "border-outline-variant"}`}>
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
      <div className={`text-headline-md font-bold mt-1 ${highlight ? "text-role-validator animate-pulse" : "text-on-surface"}`}>
        {value}
      </div>
      {st && <div className="text-label-sm text-primary mt-1">{st}</div>}
    </div>
  );
}

const QUICK_ICONS = {
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.5" />
      <circle cx="4.5" cy="12" r="1.5" />
      <circle cx="4.5" cy="18" r="1.5" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
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
