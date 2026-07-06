import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { LotStatus, LotStatusLabel, FibreTypeLabel } from "../../contracts/HarvestLedger";
import { gramsToKg, shorten, timeAgo } from "../../lib/utils";
import StatusChip from "../../components/ui/StatusChip";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { LotCardSkeleton } from "../../components/ui/Skeleton";

export default function ValidatorAuditLog() {
  const { allLots, isLoading } = useLotQueue();

  const decided = allLots.filter(
    (l) => l.status === LotStatus.VALIDATED || l.status === LotStatus.REJECTED
  );

  return (
    <AppLayout role="VALIDATOR" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <PageHeader
          title="Audit Log"
          subtitle="Completed validator decisions and lot outcomes."
        />

        {isLoading && (
          <div className="space-y-stack-md">
            <LotCardSkeleton />
            <LotCardSkeleton />
          </div>
        )}
        {!isLoading && decided.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No validation decisions recorded yet.</p>
        )}

        <div className="space-y-stack-md">
          {decided.map((lot) => (
            <Card key={lot.lotId.toString()} role="validator" className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-surface-container p-2 rounded-lg text-role-validator">
                  <Icon name="history" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Lot #{lot.lotId.toString()}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {FibreTypeLabel[lot.fibreType]} · {gramsToKg(lot.weightGrams)}kg · {shorten(lot.farmer)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    By {shorten(lot.validatedBy)} · {timeAgo(lot.validatedAt)}
                  </p>
                </div>
              </div>
              <StatusChip status={LotStatusLabel[lot.status]} />
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
