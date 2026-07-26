import { Link } from "react-router-dom";
import TopAppBar from "../../components/nav/TopAppBar";

export default function TermsOfUse() {
  return (
    <div className="min-h-dvh bg-background">
      <TopAppBar role="PUBLIC" title="Terms" />

      <main className="mx-auto max-w-2xl px-margin-mobile pb-16 pt-20">
        <p className="text-label-sm font-semibold uppercase tracking-wide text-primary">
          Melawana ea Tšebeliso · Terms of Use / EULA
        </p>
        <h1 className="mt-2 text-headline-lg font-bold text-on-surface">
          Terms of Use &amp; End User Licence
        </h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Last updated: 26 July 2026 · By connecting a wallet or using ORIGINSHEAR you agree to these terms.
        </p>

        <nav className="mt-6 rounded-xl border border-outline-variant bg-surface-container p-4 text-body-sm">
          <p className="mb-2 font-semibold text-on-surface">Major clauses</p>
          <ul className="list-inside list-disc space-y-1 text-on-surface-variant">
            <li><a href="#licence" className="text-primary underline">Licence to use</a></li>
            <li><a href="#roles" className="text-primary underline">Roles and honest use</a></li>
            <li><a href="#blockchain" className="text-primary underline">Blockchain &amp; irreversibility</a></li>
            <li><a href="#payments" className="text-primary underline">Payments &amp; fees</a></li>
            <li><a href="#conduct" className="text-primary underline">Prohibited conduct</a></li>
            <li><a href="#disclaimer" className="text-primary underline">Prototype disclaimer</a></li>
            <li><a href="#liability" className="text-primary underline">Liability</a></li>
            <li><a href="#law" className="text-primary underline">Governing context</a></li>
          </ul>
        </nav>

        <section id="licence" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">1. Licence to use</h2>
          <p className="text-body-md text-on-surface-variant">
            We grant you a limited, non-exclusive, non-transferable licence to access ORIGINSHEAR
            for lawful wool and mohair provenance, validation, and marketplace activity. You do
            not acquire ownership of the smart contracts, trademarks, or application code by using
            the service. Academic Capstone use and LNWMGA pilot use are the intended contexts.
          </p>
        </section>

        <section id="roles" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">2. Roles and honest use</h2>
          <p className="text-body-md text-on-surface-variant">
            Farmers may register only lots they are authorised to represent. Validators must grade
            and approve in good faith according to LNWMGA practice. Buyers must not misrepresent
            verification outcomes. Government users may publish oversight information but must not
            use privileged access to falsify origin. Role abuse undermines the trust the system
            exists to create and is grounds for role revocation.
          </p>
        </section>

        <section id="blockchain" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">3. Blockchain and irreversibility</h2>
          <p className="text-body-md text-on-surface-variant">
            Transactions you confirm with your wallet are broadcast to a public network. Failed,
            mistaken, or unwanted on-chain actions generally cannot be reversed by ORIGINSHEAR.
            You are responsible for reviewing lot details before signing. Wallet seed phrases and
            private keys are yours alone — never share them with support, validators, or developers.
          </p>
        </section>

        <section id="payments" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">4. Payments and platform fee</h2>
          <p className="text-body-md text-on-surface-variant">
            Marketplace settlement uses cUSD escrow. A platform fee (currently configured at 2%,
            contract-capped) may be deducted when payment is released after validated handover.
            Network gas fees are separate and paid to the blockchain network, not to ORIGINSHEAR
            as profit. Testnet tokens have no real-world cash value.
          </p>
        </section>

        <section id="conduct" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">5. Prohibited conduct</h2>
          <ul className="list-disc space-y-2 pl-5 text-body-md text-on-surface-variant">
            <li>Registering false lots, forged photos, or misleading GPS/season data.</li>
            <li>Attempting to escalate privileges or bypass role checks.</li>
            <li>Using the platform to launder funds or violate Lesotho or applicable trade law.</li>
            <li>Scraping or republishing farmer data for surveillance or exclusionary credit scoring without lawful basis.</li>
          </ul>
        </section>

        <section id="disclaimer" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">6. Prototype and academic disclaimer</h2>
          <p className="text-body-md text-on-surface-variant">
            The current deployment on Celo Sepolia is a Capstone prototype for demonstration,
            testing, and academic assessment. It is not a regulated financial exchange, not a
            government registry of record unless formally adopted, and not a guarantee of export
            acceptance by any customs authority. Features may change; availability is not guaranteed.
          </p>
        </section>

        <section id="liability" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">7. Liability</h2>
          <p className="text-body-md text-on-surface-variant">
            To the fullest extent permitted by law, ORIGINSHEAR and its student developer are not
            liable for losses from wallet compromise, user error when signing transactions,
            third-party wallet software, network congestion, or buyer/seller commercial disputes
            outside the escrow rules encoded in the contracts. Nothing in these terms excludes
            liability that cannot be excluded under applicable law.
          </p>
        </section>

        <section id="law" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">8. Governing context</h2>
          <p className="text-body-md text-on-surface-variant">
            These terms are interpreted in light of Lesotho law (including the Data Protection
            Act, 2011), relevant SADC digital-trade expectations for cross-border wool/mohair
            flows, and ALU institutional research ethics requirements. Related privacy practices
            are described in the Privacy Policy.
          </p>
        </section>

        <p className="mt-10 text-body-sm text-on-surface-variant">
          Related:{" "}
          <Link to="/legal/privacy" className="font-semibold text-primary underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link to="/" className="font-semibold text-primary underline">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
