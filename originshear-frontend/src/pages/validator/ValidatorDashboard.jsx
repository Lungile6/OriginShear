import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { useEscrowOffers } from "../../hooks/useEscrowOffers";
import { LotStatus, LotStatusLabel, FibreTypeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, timeAgo, shorten } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";
import StatCard from "../../components/ui/StatCard";
import QuickAction from "../../components/ui/QuickAction";
import DashboardHeader from "../../components/ui/DashboardHeader";
import BilingualText from "../../components/ui/BilingualText";
import Card from "../../components/ui/Card";
import { LotCardSkeleton, StatRailSkeleton } from "../../components/ui/Skeleton";

export default function ValidatorDashboard() {
  const { allLots, pendingLots, isLoading } = useLotQueue();
  const { offers: escrowOffers } = useEscrowOffers();

  const pendingCount = pendingLots.length;
  const escrowCount = escrowOffers.length;
  const decidedLots = allLots.filter(
    (l) => l.status === LotStatus.VALIDATED || l.status === LotStatus.REJECTED
  );
  const approvedCount = decidedLots.filter((l) => l.status === LotStatus.VALIDATED).length;
  const rejectedCount = decidedLots.filter((l) => l.status === LotStatus.REJECTED).length;
  const recentAudits = decidedLots.slice(0, 3);

  return (
    <AppLayout role="VALIDATOR" title="ORIGINSHEAR">
      <DashboardHeader
        role="VALIDATOR"
        subtitle="LNWMGA Portal"
        detail="District Office (Quthing)"
      />

      <section className="px-4 flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {isLoading ? (
          <StatRailSkeleton count={4} />
        ) : (
          <>
            <StatCard
              label="Pending Queue"
              st="Loto tse letetseng"
              value={pendingCount}
              highlight={pendingCount > 0}
              accent="validator"
            />
            <StatCard
              label="Escrow Release"
              st="Litefiso tse lokisitsoeng"
              value={escrowCount}
              highlight={escrowCount > 0}
              accent="validator"
            />
            <StatCard label="Approved Lots" st="Loto tse lumetsoeng" value={approvedCount} />
            <StatCard label="Rejected Lots" st="Loto tse hanetsoeng" value={rejectedCount} />
          </>
        )}
      </section>

      <section className="px-4 mt-6">
        <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest mb-2">
          <BilingualText en="Quick Actions" st="Liketso tse Potlakileng" size="label-lg" />
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <QuickAction to="/validator/queue" icon="queue" title="Validation Queue" st="Loto tse Letetseng" />
          <QuickAction to="/validator/release" icon="escrow" title="Escrow Release" st="Ho Lokolla Litefiso" />
          <QuickAction to="/validator/audit" icon="audit" title="Audit Log" st="Tlaleho ea Tlhahlobo" />
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
          {isLoading && (
            <>
              <LotCardSkeleton />
              <LotCardSkeleton />
            </>
          )}
          {!isLoading && recentAudits.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              No audit decisions recorded yet. Check the queue for pending lots.
            </p>
          )}
          {recentAudits.map((lot) => (
            <Card key={lot.lotId.toString()} role="validator" className="flex justify-between items-center">
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
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
