import { useState } from "react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { LNWMGA_OFFICES, officeMapsUrl, SUPPORT } from "../../lib/support";
import { shorten } from "../../lib/utils";
import TopAppBar from "../../components/nav/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";

export default function FarmerOnboarding() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [showOffices, setShowOffices] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  function handleCopy() {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <TopAppBar role="AUTH" />
      <div className="bg-role-validator text-white px-6 pt-20 pb-8">
        <h1 className="text-headline-md font-bold mb-2">Almost there.</h1>
        <p className="text-body-md text-white/80">
          To participate in the national wool and mohair trade, your digital wallet must be
          verified in person at your nearest LNWMGA district office.
        </p>
        <Button
          fullWidth={false}
          size="sm"
          className="mt-5"
          onClick={() => setShowOffices(true)}
          icon={<Icon name="location_on" className="!text-base" />}
        >
          Find Nearest Office
        </Button>
      </div>

      <div className="px-margin-mobile -mt-4 z-10">
        <Card>
          <h2 className="font-bold text-on-surface flex items-center gap-2 mb-4">
            <Icon name="fingerprint" className="text-primary" />
            Your Digital Identity
          </h2>

          <p className="text-label-md text-on-surface-variant uppercase mb-1">Current wallet address</p>
          <div className="flex items-center justify-between bg-surface-container rounded-lg px-3 py-2.5 mb-4">
            <code className="text-body-sm">{address ? shorten(address, 8, 6) : "Not connected"}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="text-primary text-label-sm font-semibold flex items-center gap-1"
            >
              <Icon name="content_copy" className="!text-base" />
              {copied ? "Copied" : "Copy"}
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
        </Card>

        <Card className="mt-stack-md">
          <h2 className="font-bold text-on-surface mb-4">Registration</h2>
          <ol className="space-y-4">
            <Step done title="Wallet Created" desc="Digital keys generated locally." />
            <Step active title="Office Verification" desc="Awaiting district visit." />
            <Step title="Role Assignment" desc="Unlocking trading permissions." />
            <Step title="First Consignment" desc="Ready for the shearing season." />
          </ol>
        </Card>

        <Card className="mt-stack-md mb-8 bg-surface-container">
          <h3 className="font-bold mb-1">Need help getting there?</h3>
          <p className="text-body-sm text-on-surface-variant mb-3">
            Contact your local extension officer for transport assistance.
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowContacts(true)}>
            View Contacts
          </Button>
        </Card>
      </div>

      {showOffices && (
        <Sheet title="LNWMGA District Offices" onClose={() => setShowOffices(false)}>
          <div className="space-y-3">
            {LNWMGA_OFFICES.map((office) => (
              <div key={office.district} className="border border-outline-variant rounded-lg p-4">
                <p className="font-bold">{office.district}</p>
                <p className="text-body-sm text-on-surface-variant">{office.address}</p>
                <p className="text-body-sm text-on-surface-variant">{office.hours}</p>
                <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="text-primary text-body-sm font-semibold">
                  {office.phone}
                </a>
                <a
                  href={officeMapsUrl(office)}
                  target="_blank"
                  rel="noreferrer"
                  className="block mt-2 text-primary text-body-sm font-semibold"
                >
                  Open in Maps →
                </a>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {showContacts && (
        <Sheet title="Extension Officer Contacts" onClose={() => setShowContacts(false)}>
          <div className="space-y-3 text-body-sm">
            <p>
              <span className="font-semibold block">Support line</span>
              <a href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`} className="text-primary">
                {SUPPORT.phone}
              </a>
            </p>
            <p>
              <span className="font-semibold block">Email</span>
              <a href={`mailto:${SUPPORT.email}`} className="text-primary">
                {SUPPORT.email}
              </a>
            </p>
            <button
              type="button"
              onClick={() => navigate("/news")}
              className="w-full h-11 rounded-lg border border-outline-variant font-semibold"
            >
              View Ministry Bulletins
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
      <div className="bg-surface w-full max-w-[480px] rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-headline-sm font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant font-semibold">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Step({ title, desc, done = false, active = false }) {
  return (
    <li className="flex gap-3">
      <span
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          done || active ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
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
