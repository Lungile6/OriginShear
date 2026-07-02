import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import AppLayout from "../../layouts/AppLayout";
import { usePaymentHistory } from "../../hooks/usePaymentHistory";
import { formatCUSD, cusdToLSL, shorten } from "../../lib/utils";
import BilingualText from "../../components/ui/BilingualText";

export default function BuyerPurchaseHistory() {
  const { address } = useAccount();
  const { payments, isLoading } = usePaymentHistory(address);

  const purchases = useMemo(
    () =>
      payments.filter(
        (p) => p.buyer?.toLowerCase() === address?.toLowerCase()
      ),
    [payments, address]
  );

  const totalSpentWei = purchases.reduce(
    (acc, curr) => acc + BigInt(curr.netAmount || 0n) + BigInt(curr.fee || 0n),
    0n
  );
  const totalFeesWei = purchases.reduce(
    (acc, curr) => acc + BigInt(curr.fee || 0n),
    0n
  );

  return (
    <AppLayout role="BUYER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <h1 className="text-headline-md font-bold mb-1">
          <BilingualText en="Purchase History" st="Nalane ea Litefiso" size="headline-md" />
        </h1>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Completed purchases with accurate net amounts from PaymentReleased events
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <SummaryCard label="Total Purchases" st="Loto tse rekileng" value={purchases.length} />
          <SummaryCard
            label="Total Spent"
            st="Tefiso kaofela"
            value={`${formatCUSD(totalSpentWei)} cUSD`}
          />
        </div>

        {isLoading && (
          <p className="text-body-sm text-on-surface-variant">Loading purchase history…</p>
        )}

        {!isLoading && purchases.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            No completed purchases yet. Browse the marketplace to buy validated lots.
          </p>
        )}

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm divide-y divide-outline-variant">
          {purchases.map((p) => {
            const grossWei = BigInt(p.netAmount || 0n) + BigInt(p.fee || 0n);
            return (
              <Link
                key={p.offerId.toString()}
                to={`/buyer/lots/${p.lotId.toString()}`}
                className="p-4 flex justify-between items-center active:bg-surface-container"
              >
                <div>
                  <p className="font-bold text-body-lg">Lot #{p.lotId.toString()}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    Farmer: {shorten(p.farmer)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Net: {formatCUSD(p.netAmount)} · Fee: {formatCUSD(p.fee)} cUSD
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">-{formatCUSD(grossWei)} cUSD</p>
                  <p className="text-[10px] text-on-surface-variant">
                    ≈ {cusdToLSL(grossWei)} LSL
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {purchases.length > 0 && (
          <p className="text-label-sm text-on-surface-variant mt-4 text-center">
            Platform fees total: {formatCUSD(totalFeesWei)} cUSD (2%)
          </p>
        )}
      </div>
    </AppLayout>
  );
}

function SummaryCard({ label, st, value }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
      <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
      <p className="text-headline-sm font-bold text-on-surface mt-1">{value}</p>
      {st && <p className="text-label-sm text-primary mt-1">{st}</p>}
    </div>
  );
}
