import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopAppBar from "../../components/nav/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo === "how-it-works") {
      const timer = setTimeout(() => {
        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  function handleBuyerEntry() {
    navigate("/buyer/marketplace");
  }

  return (
    <div className="min-h-dvh bg-background">
      <TopAppBar role="PUBLIC" />

      <section className="bg-role-validator text-white px-margin-mobile py-10 pt-20">
        <h1 className="text-headline-lg font-bold mb-3">
          From Highland Farm to Global Market — With Proof.
        </h1>
        <p className="text-body-md text-white/80 mb-6">
          We provide Lesotho's wool and mohair producers with unforgeable digital identities,
          securing fair value through blockchain transparency.
        </p>
        <div className="space-y-3">
          <Button size="lg" onClick={() => navigate("/role-select")} icon={<Icon name="agriculture" />}>
            I'm a Farmer
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10"
            onClick={handleBuyerEntry}
            icon={<Icon name="shopping_cart" />}
          >
            I'm a Buyer / Verifier
          </Button>
        </div>
      </section>

      <section className="px-margin-mobile py-10 text-center">
        <h2 className="text-headline-md font-bold mb-6 max-w-sm mx-auto">
          Lesotho's farmers produce world-class wool. The system fails them.
        </h2>
        <div className="space-y-stack-md">
          <StatCard value="25%" label="Rejection Rate" desc="Lots often rejected at port due to lack of traceable documentation and provenance records." />
          <StatCard value="22%" label="Value Lost" desc="Middlemen and brokers capture significant margins when farmers lack direct market data." />
          <StatCard value="0" label="Digital Records" desc="Vast majority of farmers have no verifiable history, making credit and insurance inaccessible." />
        </div>
      </section>

      <section id="how-it-works" className="px-margin-mobile py-10 bg-surface-container scroll-mt-16">
        <h2 className="text-headline-md font-bold mb-1">A transparent path to global prosperity.</h2>
        <p className="text-body-sm text-on-surface-variant mb-6">
          Register on-chain, get validator approval, sell with proof, and receive cUSD directly.
        </p>
        <ol className="space-y-stack-md">
          <HowStep icon="edit_document" n="1" title="Register" desc="Log your shearing event on-site with photos and biometric verification." />
          <HowStep icon="verified" n="2" title="Get Proof" desc="Validators confirm your quality, minting a non-fungible certificate of origin." />
          <HowStep icon="qr_code_2" n="3" title="Generate" desc="Each lot gets a unique QR code linked to the blockchain record for buyers." />
          <HowStep icon="payments" n="4" title="Get Paid" desc="Instant settlement in cUSD directly to your mobile wallet upon sale." />
        </ol>
      </section>

      <section className="px-margin-mobile py-10">
        <h2 className="text-headline-md font-bold mb-6">Designed for the entire value chain.</h2>
        <div className="space-y-stack-md">
          <AudienceRow icon="agriculture" border="border-l-role-farmer" pretitle="LNWMGA Members" title="Farmers" desc="Protect your hard work with a permanent record across global markets directly." cta="Join Portal" onClick={() => navigate("/role-select")} />
          <AudienceRow icon="verified_user" border="border-l-role-validator" pretitle="Official Agents" title="Validators" desc="Digitize the grading and clearing process with mobile tools built for the field." cta="Agent Login" onClick={() => navigate("/role-select")} />
          <AudienceRow icon="account_balance" border="border-l-role-government" pretitle="Government" title="Ministry" desc="Real-time agricultural data dashboards for policy making and trade oversight." cta="Admin Access" onClick={() => navigate("/role-select")} />
          <AudienceRow icon="shopping_cart" border="border-l-role-buyer" pretitle="Global Traders" title="Buyers" desc="Source with absolute confidence. Proof of origin and quality in every single bale." cta="Marketplace" onClick={handleBuyerEntry} />
        </div>
      </section>

      <footer className="px-margin-mobile py-8 text-center text-label-sm text-on-surface-variant border-t border-outline-variant">
        © 2026 ORIGINSHEAR. Built for Lesotho Agriculture.
      </footer>
    </div>
  );
}

function StatCard({ value, label, desc }) {
  return (
    <Card className="text-left">
      <p className="text-headline-xl font-bold text-error">{value}</p>
      <p className="font-bold text-body-md mb-1">{label}</p>
      <p className="text-body-sm text-on-surface-variant">{desc}</p>
    </Card>
  );
}

function HowStep({ icon, n, title, desc }) {
  return (
    <li className="flex gap-4 items-start">
      <span className="shrink-0 w-9 h-9 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center">
        {n}
      </span>
      <div className="flex-1">
        <p className="font-bold text-body-md flex items-center gap-2">
          <Icon name={icon} className="text-primary !text-lg" />
          {title}
        </p>
        <p className="text-body-sm text-on-surface-variant">{desc}</p>
      </div>
    </li>
  );
}

function AudienceRow({ icon, border, pretitle, title, desc, cta, onClick }) {
  return (
    <Card role="none" className={`border-l-4 ${border}`}>
      <div className="flex items-start gap-3">
        <div className="bg-surface-container p-2 rounded-lg text-primary shrink-0">
          <Icon name={icon} />
        </div>
        <div className="flex-1">
          <p className="text-label-sm text-on-surface-variant uppercase mb-0.5">{pretitle}</p>
          <p className="font-bold text-body-lg mb-1">{title}</p>
          <p className="text-body-sm text-on-surface-variant mb-3">{desc}</p>
          <button type="button" onClick={onClick} className="text-primary font-semibold text-body-sm inline-flex items-center gap-1">
            {cta}
            <Icon name="arrow_forward" className="!text-base" />
          </button>
        </div>
      </div>
    </Card>
  );
}
