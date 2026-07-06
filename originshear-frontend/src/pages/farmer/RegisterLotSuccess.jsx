import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import LotStepper from "../../components/ui/LotStepper";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { shorten } from "../../lib/utils";

export default function RegisterLotSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const txHash = state?.txHash;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-6 max-w-[1024px] mx-auto">
        <LotStepper current={3} />

        <div className="flex flex-col items-center text-center mt-stack-lg py-stack-lg">
          <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-stack-lg shadow-sm">
            <Icon name="check_circle" filled size={48} />
          </div>
          <h1 className="text-headline-md font-bold text-primary mb-2">Transaction Success</h1>
          <p className="text-body-md text-on-surface-variant mb-1">Lot has been successfully registered on the ledger.</p>
          <p className="text-body-sm text-on-surface-variant mb-stack-lg max-w-xs">
            Loto e ngolisitsoe ka katleho — awaiting LNWMGA validation.
          </p>

          {txHash && (
            <div className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-stack-md mb-stack-lg text-left">
              <p className="text-label-sm text-on-surface-variant mb-1">Transaction Hash</p>
              <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded border border-outline-variant">
                <code className="text-[10px] sm:text-xs font-mono text-on-surface break-all">
                  {shorten(txHash, 10, 8)}
                </code>
              </div>
            </div>
          )}

          <div className="flex items-center gap-stack-sm text-on-surface-variant">
            <Icon name="sync" size={16} className="animate-spin" />
            <p className="text-label-sm">Redirect to My Lots when ready</p>
          </div>
        </div>

        <Button size="lg" onClick={() => navigate("/farmer/lots")}>
          View My Lots (Loto)
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate("/farmer")} className="mt-3">
          Back to Dashboard
        </Button>
      </div>
    </AppLayout>
  );
}
