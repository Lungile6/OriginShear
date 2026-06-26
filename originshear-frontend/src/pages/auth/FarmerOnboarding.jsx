import { useAccount } from "wagmi";
import { shorten } from "../../lib/utils";

export default function FarmerOnboarding() {
  const { address } = useAccount();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="bg-role-validator text-white px-6 pt-10 pb-8">
        <h1 className="text-headline-md font-bold mb-2">Almost there.</h1>
        <p className="text-body-md text-white/80">
          To participate in the national wool and mohair trade, your digital wallet must be
          verified in person at your nearest LNWMGA district office.
        </p>
        <button className="mt-5 inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2.5 font-semibold text-body-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          Find Nearest Office
        </button>
      </div>

      <div className="px-6 -mt-4 z-10">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-5">
          <h2 className="font-bold text-on-surface flex items-center gap-2 mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
              <path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
              <path d="M6 12c0 3 2.7 5.4 6 5.4s6-2.4 6-5.4" strokeLinecap="round" />
            </svg>
            Your Digital Identity
          </h2>

          <p className="text-label-md text-on-surface-variant uppercase mb-1">Current wallet address</p>
          <div className="flex items-center justify-between bg-surface-container rounded-lg px-3 py-2.5 mb-4">
            <code className="text-body-sm">{address ? shorten(address, 8, 6) : "Not connected"}</code>
            <button className="text-primary text-label-sm font-semibold flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="9" y="9" width="11" height="11" rx="1.5" />
                <path d="M5 15V6a1.5 1.5 0 0 1 1.5-1.5H15" />
              </svg>
              Copy
            </button>
          </div>

          <p className="text-label-md text-on-surface-variant uppercase mb-2">Required at office</p>
          <ul className="space-y-2 mb-1">
            {["National ID / Passport", "Shearing Records", "Mobile Phone", "Brand Certificate"].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 bg-surface-container rounded-lg px-3 py-2.5 text-body-sm text-on-surface"
                >
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-5 mt-4">
          <h2 className="font-bold text-on-surface mb-4">Registration</h2>
          <ol className="space-y-4">
            <Step done title="Wallet Created" desc="Digital keys generated locally." />
            <Step active title="Office Verification" desc="Awaiting district visit." />
            <Step title="Role Assignment" desc="Unlocking trading permissions." />
            <Step title="First Consignment" desc="Ready for the shearing season." />
          </ol>
        </div>

        <div className="bg-surface-container rounded-xl p-5 mt-4 mb-8">
          <h3 className="font-bold mb-1">Need help getting there?</h3>
          <p className="text-body-sm text-on-surface-variant mb-3">
            Contact your local extension officer for transport assistance.
          </p>
          <button className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-lowest font-semibold text-body-sm">
            View Contacts
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ title, desc, done = false, active = false }) {
  return (
    <li className="flex gap-3">
      <span
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          done
            ? "bg-primary text-on-primary"
            : active
            ? "bg-primary text-on-primary"
            : "bg-surface-container-high text-on-surface-variant"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <div>
        <p className={`font-semibold text-body-sm ${active || done ? "text-on-surface" : "text-on-surface-variant"}`}>
          {title}
        </p>
        <p className="text-label-sm text-on-surface-variant">{desc}</p>
      </div>
    </li>
  );
}
