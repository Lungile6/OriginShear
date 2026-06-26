import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex justify-between items-center px-4 py-3 border-b border-outline-variant">
        <button className="text-on-surface-variant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-headline-sm font-bold text-primary uppercase">ORIGINSHEAR</span>
        <button
          onClick={() => navigate("/connect")}
          className="text-label-sm font-bold text-primary"
        >
          Connect
        </button>
      </header>

      <section className="bg-role-validator text-white px-6 py-10">
        <h1 className="text-headline-lg font-bold mb-3">
          From Highland Farm to Global Market — With Proof.
        </h1>
        <p className="text-body-md text-white/80 mb-6">
          We provide Lesotho's wool and mohair producers with unforgeable digital identities,
          securing fair value through blockchain transparency.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate("/role-select")}
            className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold"
          >
            I'm a Farmer
          </button>
          <button
            onClick={() => navigate("/verify")}
            className="w-full h-14 rounded-lg border border-white/40 text-white font-semibold"
          >
            I'm a Buyer / Verifier
          </button>
        </div>
      </section>

      <section className="px-6 py-10 text-center">
        <h2 className="text-headline-md font-bold mb-6 max-w-sm mx-auto">
          Lesotho's farmers produce world-class wool. The system fails them.
        </h2>
        <div className="space-y-3">
          <StatCard value="25%" label="Rejection Rate" desc="Lots often rejected at port due to lack of traceable documentation and provenance records." />
          <StatCard value="22%" label="Value Lost" desc="Middlemen and brokers capture significant margins when farmers lack direct market data." />
          <StatCard value="0" label="Digital Records" desc="Vast majority of farmers have no verifiable history, making credit and insurance inaccessible." />
        </div>
      </section>

      <section className="px-6 py-10 bg-surface-container">
        <h2 className="text-headline-md font-bold mb-1">A transparent path to global prosperity.</h2>
        <button className="text-primary font-semibold text-body-sm inline-flex items-center gap-1 mb-6">
          Learn about our protocol
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ol className="space-y-4">
          <HowStep n="1" title="Register" desc="Log your shearing event on-site with photos and biometric verification." />
          <HowStep n="2" title="Get Proof" desc="Validators confirm your quality, minting a non-fungible certificate of origin." />
          <HowStep n="3" title="Generate" desc="Each lot gets a unique QR code linked to the blockchain record for buyers." />
          <HowStep n="4" title="Get Paid" desc="Instant settlement in cUSD directly to your mobile wallet upon sale." />
        </ol>
      </section>

      <section className="px-6 py-10">
        <h2 className="text-headline-md font-bold mb-6">Designed for the entire value chain.</h2>
        <div className="space-y-4">
          <AudienceRow border="border-l-role-farmer" pretitle="LNWMGA Members" title="Farmers" desc="Protect your hard work with a permanent record across global markets directly." cta="Join Portal" onClick={() => navigate("/role-select")} />
          <AudienceRow border="border-l-role-validator" pretitle="Official Agents" title="Validators" desc="Digitize the grading and clearing process with mobile tools built for the field." cta="Agent Login" onClick={() => navigate("/role-select")} />
          <AudienceRow border="border-l-role-government" pretitle="Government" title="Ministry" desc="Real-time agricultural data dashboards for policy making and trade oversight." cta="Admin Access" onClick={() => navigate("/role-select")} />
          <AudienceRow border="border-l-role-buyer" pretitle="Global Traders" title="Buyers" desc="Source with absolute confidence. Proof of origin and quality in every single bale." cta="Marketplace" onClick={() => navigate("/verify")} />
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-label-sm text-on-surface-variant border-t border-outline-variant">
        © 2026 ORIGINSHEAR. Built for Lesotho Agriculture.
      </footer>
    </div>
  );
}

function StatCard({ value, label, desc }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 text-left">
      <p className="text-headline-xl font-bold text-error">{value}</p>
      <p className="font-bold text-body-md mb-1">{label}</p>
      <p className="text-body-sm text-on-surface-variant">{desc}</p>
    </div>
  );
}

function HowStep({ n, title, desc }) {
  return (
    <li className="flex gap-4 items-start">
      <span className="shrink-0 w-9 h-9 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center">
        {n}
      </span>
      <div>
        <p className="font-bold text-body-md">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{desc}</p>
      </div>
    </li>
  );
}

function AudienceRow({ border, pretitle, title, desc, cta, onClick }) {
  return (
    <div className={`bg-surface-container-lowest border border-outline-variant border-l-4 ${border} rounded-xl p-4`}>
      <p className="text-label-sm text-on-surface-variant uppercase mb-0.5">{pretitle}</p>
      <p className="font-bold text-body-lg mb-1">{title}</p>
      <p className="text-body-sm text-on-surface-variant mb-3">{desc}</p>
      <button onClick={onClick} className="text-primary font-semibold text-body-sm">
        {cta} →
      </button>
    </div>
  );
}
