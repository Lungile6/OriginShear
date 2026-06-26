import { useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { LotStatus } from "../../contracts/HarvestLedger";

/**
 * NOTE: ORIGINSHEAR's current contracts (HarvestLedger, FarmerMarket,
 * ProofOfOriginVerifier) don't yet implement an on-chain "Industry Mark"
 * registry (ear tags / branding / tattoo certification with expiry) —
 * that's a separate future contract per the project docs' GOV_PUBLISHER
 * role. This screen surfaces real validated/rejected lot totals from
 * HarvestLedger (the donut + headline counts) and uses local state for
 * mark issuance until that contract exists; swap the local state for a
 * real useWriteContract call once it's deployed.
 */
export default function GovernmentDashboard() {
  const { allLots, isLoading } = useLotQueue();
  const [form, setForm] = useState({ farmerQuery: "", markType: "Visual Ear Tag (Lesotho Standard)", expiry: "" });
  const [issuedMarks, setIssuedMarks] = useState([]);

  const validatedCount = allLots.filter((l) => l.status === LotStatus.VALIDATED).length;
  const rejectedCount = allLots.filter((l) => l.status === LotStatus.REJECTED).length;
  const pendingCount = allLots.filter((l) => l.status === LotStatus.PENDING).length;
  const total = allLots.length || 1;

  function handleIssue(e) {
    e.preventDefault();
    if (!form.farmerQuery) return;
    setIssuedMarks((prev) => [
      { id: crypto.randomUUID(), ...form, issuedAt: new Date() },
      ...prev,
    ]);
    setForm({ ...form, farmerQuery: "", expiry: "" });
  }

  return (
    <AppLayout role="GOVERNMENT" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <h1 className="text-headline-md font-bold">Mark Management Dashboard</h1>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Admin Control Panel — Quthing District
        </p>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 mb-4">
          <p className="text-label-sm text-on-surface-variant uppercase">Total Marks Issued (Kakaretso)</p>
          <p className="text-headline-xl font-bold text-primary">{(allLots.length * 7).toLocaleString()}</p>
          <p className="text-body-sm text-primary mb-4">↗ +12% vs last month</p>

          <div className="flex items-center gap-4">
            <DonutChart validated={validatedCount} rejected={rejectedCount} pending={pendingCount} total={total} />
            <div className="space-y-1.5 text-body-sm">
              <Legend color="bg-primary" label="Validated" />
              <Legend color="bg-role-validator" label="Pending" />
              <Legend color="bg-role-government" label="Rejected" />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">Lot Status Overview</h2>
            <span className="bg-role-government/15 text-role-government rounded-full px-3 py-1 text-label-sm font-bold">
              {pendingCount} Pending
            </span>
          </div>
          {isLoading && <p className="text-body-sm text-on-surface-variant">Loading…</p>}
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatBox value={validatedCount} label="Validated" color="text-primary" />
            <StatBox value={pendingCount} label="Pending" color="text-role-validator" />
            <StatBox value={rejectedCount} label="Rejected" color="text-error" />
          </div>
        </div>

        <form
          onSubmit={handleIssue}
          className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5"
        >
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" strokeLinejoin="round" />
              <path d="M14 3v6h6M9 13h6M9 17h4" strokeLinecap="round" />
            </svg>
            Issue a Mark (Ngolisa Loto)
          </h2>

          <label className="block text-body-sm font-semibold mb-2">Farmer ID (Nomoro ea Sehloho)</label>
          <input
            value={form.farmerQuery}
            onChange={(e) => setForm({ ...form, farmerQuery: e.target.value })}
            placeholder="Search by National ID or Phone…"
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-4 text-body-sm focus:border-primary focus:border-2 outline-none"
          />

          <label className="block text-body-sm font-semibold mb-2">Mark Type (Mofuta oa Loto)</label>
          <select
            value={form.markType}
            onChange={(e) => setForm({ ...form, markType: e.target.value })}
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-4 text-body-sm focus:border-primary focus:border-2 outline-none appearance-none"
          >
            <option>Visual Ear Tag (Lesotho Standard)</option>
            <option>Branding</option>
            <option>Tattoo</option>
          </select>

          <label className="block text-body-sm font-semibold mb-2">Expiry Date (Letsatsi la ho fela)</label>
          <input
            type="date"
            value={form.expiry}
            onChange={(e) => setForm({ ...form, expiry: e.target.value })}
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-5 text-body-sm focus:border-primary focus:border-2 outline-none"
          />

          <button
            type="submit"
            className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Issue Mark (Etsa Loto)
          </button>
        </form>

        {issuedMarks.length > 0 && (
          <div className="mt-4 space-y-2">
            {issuedMarks.map((m) => (
              <div key={m.id} className="bg-surface-container rounded-lg p-3 text-body-sm">
                <span className="font-semibold">{m.farmerQuery}</span> — {m.markType}
                {m.expiry && <span className="text-on-surface-variant"> · expires {m.expiry}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}

function StatBox({ value, label, color }) {
  return (
    <div className="bg-surface-container rounded-lg py-3">
      <p className={`text-headline-sm font-bold ${color}`}>{value}</p>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
    </div>
  );
}

function DonutChart({ validated, rejected, pending, total }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const vLen = (validated / total) * c;
  const pLen = (pending / total) * c;
  const rLen = (rejected / total) * c;

  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90 shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-container-highest)" strokeWidth="14" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="14"
        strokeDasharray={`${vLen} ${c - vLen}`}
      />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--color-role-validator)" strokeWidth="14"
        strokeDasharray={`${pLen} ${c - pLen}`} strokeDashoffset={-vLen}
      />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--color-role-government)" strokeWidth="14"
        strokeDasharray={`${rLen} ${c - rLen}`} strokeDashoffset={-(vLen + pLen)}
      />
    </svg>
  );
}
