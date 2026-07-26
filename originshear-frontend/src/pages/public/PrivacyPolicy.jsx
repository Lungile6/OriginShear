import { Link } from "react-router-dom";
import TopAppBar from "../../components/nav/TopAppBar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-background">
      <TopAppBar role="PUBLIC" title="Privacy" />

      <main className="mx-auto max-w-2xl px-margin-mobile pb-16 pt-20">
        <p className="text-label-sm font-semibold uppercase tracking-wide text-primary">
          Polisi ea Lekunutu · Privacy Policy
        </p>
        <h1 className="mt-2 text-headline-lg font-bold text-on-surface">
          Privacy Policy
        </h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Last updated: 26 July 2026 · Applies to ORIGINSHEAR (Celo Sepolia prototype and any future production deployment).
        </p>

        <nav className="mt-6 rounded-xl border border-outline-variant bg-surface-container p-4 text-body-sm">
          <p className="mb-2 font-semibold text-on-surface">On this page</p>
          <ul className="list-inside list-disc space-y-1 text-on-surface-variant">
            <li><a href="#who" className="text-primary underline">Who we are</a></li>
            <li><a href="#data" className="text-primary underline">What we collect</a></li>
            <li><a href="#why" className="text-primary underline">Why we process data</a></li>
            <li><a href="#chain" className="text-primary underline">On-chain permanence</a></li>
            <li><a href="#rights" className="text-primary underline">Your rights</a></li>
            <li><a href="#sharing" className="text-primary underline">Sharing and roles</a></li>
            <li><a href="#security" className="text-primary underline">Security</a></li>
            <li><a href="#contact" className="text-primary underline">Contact</a></li>
          </ul>
        </nav>

        <section id="who" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">1. Who we are</h2>
          <p className="text-body-md text-on-surface-variant">
            ORIGINSHEAR is a Capstone software project developed at African Leadership University
            for Lesotho National Wool and Mohair Growers&apos; Association (LNWMGA) members,
            validators, buyers, and ministry observers. For this prototype, the student developer
            acts as data controller for off-chain application data. On-chain records are published
            to the Celo public ledger and are not privately controlled after confirmation.
          </p>
        </section>

        <section id="data" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">2. What we collect</h2>
          <ul className="list-disc space-y-2 pl-5 text-body-md text-on-surface-variant">
            <li>
              <span className="font-semibold text-on-surface">Wallet identifiers:</span> public
              blockchain addresses used to authenticate and assign roles.
            </li>
            <li>
              <span className="font-semibold text-on-surface">Harvest lot metadata:</span> fibre type
              (wool/mohair), grade, weight, GPS zone, season year, and lot identifiers.
            </li>
            <li>
              <span className="font-semibold text-on-surface">Supporting evidence:</span> photos or
              documents stored off-chain (IPFS or API storage) and referenced by content hash.
            </li>
            <li>
              <span className="font-semibold text-on-surface">Marketplace activity:</span> listings,
              escrow deposits in cUSD, validation outcomes, and payment-release events.
            </li>
            <li>
              <span className="font-semibold text-on-surface">Technical logs:</span> limited server
              logs needed to operate the API (errors, request timing) — not used for advertising.
            </li>
          </ul>
        </section>

        <section id="why" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">3. Why we process data</h2>
          <p className="text-body-md text-on-surface-variant">
            We process information only to: (a) issue verifiable Proof of Origin for export and
            buyer confidence; (b) enable LNWMGA validation and audit; (c) settle farmer–buyer
            trades in cUSD escrow; and (d) support ministry visibility of aggregate sector
            activity. We do not sell personal data. We do not use farmer data for unrelated
            marketing.
          </p>
        </section>

        <section id="chain" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">4. On-chain permanence (important)</h2>
          <p className="text-body-md text-on-surface-variant">
            Proof-of-origin hashes, role grants, lot status changes, and marketplace events written
            to Celo are public and effectively permanent. They cannot be deleted like a normal
            database row. Before registering a lot, you should understand that the minimum
            on-chain fields and the Proof of Origin hash will remain visible to anyone who can
            read the ledger. Correctable or sensitive supporting files stay off-chain where
            possible; only what is needed for provenance integrity is committed on-chain.
          </p>
        </section>

        <section id="rights" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">5. Your rights</h2>
          <p className="text-body-md text-on-surface-variant">
            Consistent with Lesotho&apos;s Data Protection Act, 2011 (Act No. 5 of 2012), you may
            request access to off-chain personal information we hold, ask for correction of
            inaccurate off-chain records, and object to processing that causes unwarranted harm.
            On-chain records cannot be erased; where a lot was registered in error, we document
            corrective actions through validation status, audit logs, and off-chain notices rather
            than pretending the chain can be wiped.
          </p>
        </section>

        <section id="sharing" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">6. Sharing and roles</h2>
          <ul className="list-disc space-y-2 pl-5 text-body-md text-on-surface-variant">
            <li>Farmers see and manage their own lots and sales.</li>
            <li>Validators (LNWMGA) see pending lots needed to approve or reject provenance.</li>
            <li>Buyers see marketplace listings and proof-of-origin verification results.</li>
            <li>Government dashboards show oversight-oriented views; they must not silently alter farmer provenance.</li>
            <li>Public verification pages expose only what is required to confirm a lot&apos;s Proof of Origin.</li>
          </ul>
        </section>

        <section id="security" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">7. Security measures</h2>
          <p className="text-body-md text-on-surface-variant">
            Access to privileged actions is gated by on-chain roles and wallet authentication.
            Smart contracts are covered by automated tests. The API and IPFS paths separate
            mutable metadata from immutable provenance hashes. Users remain responsible for
            safeguarding their own wallet keys; ORIGINSHEAR never asks for a seed phrase.
          </p>
        </section>

        <section id="contact" className="mt-8 scroll-mt-20 space-y-3">
          <h2 className="text-headline-md font-bold">8. Contact and ethics clearance</h2>
          <p className="text-body-md text-on-surface-variant">
            Privacy questions for this Capstone prototype: contact the project author via ALU
            academic channels, with supervisor oversight (Dr. Aaron Izang). Field data collection,
            user testing with real farmers, or mainnet deployment proceeds only after appropriate
            institutional ethics clearance.
          </p>
        </section>

        <p className="mt-10 text-body-sm text-on-surface-variant">
          Related:{" "}
          <Link to="/legal/terms" className="font-semibold text-primary underline">
            Terms of Use / EULA
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
