import { useLocation, useNavigate } from "react-router-dom";
import { Stepper } from "./RegisterLotStep1";
import AppLayout from "../../layouts/AppLayout";
import { shorten } from "../../lib/utils";

export default function RegisterLotSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const txHash = state?.txHash;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-6">
        <Stepper current={3} />

        <div className="flex flex-col items-center text-center mt-10">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-10 w-10 text-on-primary-container">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-headline-md font-bold mb-2">Lot Registered</h1>
          <p className="text-body-md text-on-surface-variant mb-1">
            Loto e ngolisitsoe ka katleho
          </p>
          <p className="text-body-sm text-on-surface-variant mb-6 max-w-xs">
            Your harvest lot is now on the Celo blockchain and awaiting LNWMGA validation.
          </p>

          {txHash && (
            <div className="w-full bg-surface-container rounded-lg p-3 mb-6">
              <p className="text-label-sm text-on-surface-variant uppercase mb-1">Transaction Hash</p>
              <code className="text-body-sm">{shorten(txHash, 10, 8)}</code>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/farmer/lots")}
          className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold mb-3"
        >
          View My Lots
        </button>
        <button
          onClick={() => navigate("/farmer")}
          className="w-full h-12 rounded-lg border border-outline-variant text-on-surface font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    </AppLayout>
  );
}
