import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { useRole } from "../../context/RoleContext";
import { useFarmerLots } from "../../hooks/useFarmerLots";
import { useCusdBalance } from "../../hooks/useCusdBalance";
import { usePaymentHistory } from "../../hooks/usePaymentHistory";
import { LotStatus, LotStatusLabel, FibreTypeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, timeAgo, formatCUSD, cusdToLSL } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";
import StatCard from "../../components/ui/StatCard";
import QuickAction from "../../components/ui/QuickAction";
import DashboardHeader from "../../components/ui/DashboardHeader";
import BilingualText from "../../components/ui/BilingualText";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import IndustryMarksRail from "../../components/farmer/IndustryMarksRail";
import { LotCardSkeleton, StatRailSkeleton } from "../../components/ui/Skeleton";

export default function FarmerDashboard() {
  const { address } = useAccount();
  const { farmerProfile } = useRole();
  const { lots, isLoading } = useFarmerLots(address);
  const { data: balance, isLoading: loadingBalance } = useCusdBalance(address);
  const { payments, isLoading: loadingPayments } = usePaymentHistory(address);
  const [acknowledgedLots, setAcknowledgedLots] = useState(() => {
    try {
      const stored = localStorage.getItem("originshear_acknowledged_lots");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const totalWeightKg = farmerProfile ? gramsToKg(farmerProfile.totalWeightGrams) : "0";
  const lotsRegistered = farmerProfile ? Number(farmerProfile.totalLotsRegistered) : 0;
  const pendingCount = lots.filter((l) => l.status === LotStatus.PENDING).length;

  const totalEarnedWei = useMemo(
    () =>
      payments
        .filter((p) => p.farmer?.toLowerCase() === address?.toLowerCase())
        .reduce((acc, p) => acc + BigInt(p.netAmount || 0n), 0n),
    [payments, address]
  );

  const validatedLotsNotified = lots.filter(
    (l) => l.status === LotStatus.VALIDATED && !acknowledgedLots.includes(l.lotId.toString())
  );

  function handleDismissNotification(lotId) {
    const updated = [...acknowledgedLots, lotId.toString()];
    setAcknowledgedLots(updated);
    localStorage.setItem("originshear_acknowledged_lots", JSON.stringify(updated));
  }

  const recentLots = lots.slice(0, 3);
  const firstValidatedLot = lots.find((l) => l.status === LotStatus.VALIDATED);
  const qrTarget = firstValidatedLot ? `/farmer/lots/${firstValidatedLot.lotId}/qr` : "/farmer/lots";
  const loadingStats = isLoading || loadingBalance || loadingPayments;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <DashboardHeader
        role="FARMER"
        subtitle={`ID: ${farmerProfile?.farmerId || "—"}`}
        detail={farmerProfile?.district || "—"}
      />

      <section className="mt-stack-md">
        <div className="flex overflow-x-auto hide-scrollbar px-margin-mobile gap-gutter-mobile">
          {loadingStats ? (
            <StatRailSkeleton count={3} />
          ) : (
            <>
              <StatCard label="Lots Registered" st="Loto tse ngolisitsoeng" value={lotsRegistered} />
              <StatCard label="Total Weight" st="Boima kaofela" value={totalWeightKg} unit="kg" />
              <Link
                to="/farmer/market"
                className="min-w-[240px] bg-primary text-on-primary p-stack-md rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform"
              >
                <span className="text-label-sm uppercase tracking-wide text-primary-fixed">
                  Earnings / Melemo
                </span>
                <div className="flex flex-col mt-1">
                  <span className="text-headline-sm font-bold">{formatCUSD(balance ?? 0n)} cUSD</span>
                  <span className="text-headline-md font-bold">{cusdToLSL(balance ?? 0n)} LSL</span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <Icon name="account_balance_wallet" size={16} className="text-primary-fixed" />
                  <span className="text-label-sm">
                    {totalEarnedWei > 0n ? `${formatCUSD(totalEarnedWei)} earned` : "Pay-out Available"}
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>
      </section>

      {pendingCount > 0 && (
        <section className="px-margin-mobile mt-stack-lg">
          <Link
            to="/farmer/lots"
            className="bg-tertiary-fixed text-on-tertiary-fixed-variant p-4 rounded-xl flex items-center gap-3 border border-tertiary-container active:scale-[0.99] transition-transform"
          >
            <span className="bg-tertiary-container text-on-tertiary-container rounded-full p-2 flex items-center justify-center shrink-0">
              <Icon name="priority_high" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-body-md">
                {pendingCount} lot{pendingCount > 1 ? "s" : ""} awaiting LNWMGA validation
              </p>
              <p className="text-label-sm">Loto tse {pendingCount} li letetse ho netefatsoa</p>
            </div>
            <Icon name="chevron_right" />
          </Link>
        </section>
      )}

      {validatedLotsNotified.length > 0 && (
        <section className="px-margin-mobile mt-stack-md space-y-3">
          {validatedLotsNotified.map((lot) => (
            <Card
              key={lot.lotId.toString()}
              role="farmer"
              className="bg-primary-container text-on-primary-container border-primary/20"
            >
              <div className="flex items-start gap-3">
                <span className="bg-primary text-on-primary rounded-full p-2 flex items-center justify-center shrink-0">
                  <Icon name="check_circle" filled />
                </span>
                <div className="flex-1">
                  <p className="font-bold text-body-md">Lot #{lot.lotId.toString()} has been validated!</p>
                  <p className="text-label-sm">Loto #{lot.lotId.toString()} e netefalitsoe!</p>
                  <div className="flex gap-4 mt-2">
                    <Link
                      to={`/farmer/lots/${lot.lotId}/qr`}
                      className="text-label-sm font-bold text-primary underline"
                    >
                      View QR Proof / Sheba QR
                    </Link>
                    <button
                      onClick={() => handleDismissNotification(lot.lotId)}
                      className="text-label-sm font-bold text-on-surface-variant/80 hover:text-on-surface"
                    >
                      Dismiss / Hlakola
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}

      <section className="px-margin-mobile mt-stack-lg">
        <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest mb-stack-sm">
          <BilingualText en="Quick Actions" st="Liketso tse Potlakileng" size="label-lg" />
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <QuickAction to="/farmer/register" icon="register" title="Register Lot" st="Ngolisa Loto" />
          <QuickAction to="/farmer/lots" icon="lots" title="My Lots" st="Loto tsa ka" />
          <QuickAction to={qrTarget} icon="qr" title="QR Proof" st="Bopaki ba QR" />
          <QuickAction to="/farmer/market" icon="market" title="Market" st="Mmaraka" />
        </div>
      </section>

      <IndustryMarksRail farmerAddress={address} />

      <section className="px-margin-mobile mt-stack-lg pb-4">
        <div className="flex justify-between items-center mb-stack-sm">
          <h2 className="text-label-lg text-on-surface-variant uppercase tracking-widest">
            Recent Activity
          </h2>
          <Link to="/farmer/lots" className="text-primary font-bold text-label-sm">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {isLoading && (
            <>
              <LotCardSkeleton />
              <LotCardSkeleton />
            </>
          )}
          {!isLoading && recentLots.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              No lots registered yet. Tap "Register Lot" to get started.
            </p>
          )}
          {recentLots.map((lot) => (
            <Link key={lot.lotId.toString()} to={`/farmer/lots/${lot.lotId}`}>
              <Card role="farmer" className="flex justify-between items-center active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="bg-surface-container p-2 rounded-lg text-primary">
                    <Icon name="inventory_2" />
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
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/farmer/register"
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Register new lot"
      >
        <Icon name="add" size={28} />
      </Link>
    </AppLayout>
  );
}
