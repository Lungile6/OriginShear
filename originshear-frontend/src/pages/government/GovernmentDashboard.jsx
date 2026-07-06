import { useState, useEffect } from "react";
import { isAddress } from "viem";
import AppLayout from "../../layouts/AppLayout";
import { useLotQueue } from "../../hooks/useLotQueue";
import { useIndustryMarks } from "../../hooks/useIndustryMarks";
import { useFarmerMarks } from "../../hooks/useFarmerMarks";
import { LotStatus } from "../../contracts/HarvestLedger";
import { MarkTypeLabel, MarkStatus, MarkStatusLabel } from "../../contracts/IndustryMarkRegistry";
import { apiClient } from "../../lib/apiClient";
import { shorten } from "../../lib/utils";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import BilingualText from "../../components/ui/BilingualText";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";
import { FormField, inputClassName, selectClassName } from "../../components/ui/FormField";

/**
 * Government Mark Management Dashboard.
 * Displays on-chain wool/mohair lot statuses from HarvestLedger
 * and wires the Mark Issuance form to write to the IndustryMarkRegistry contract.
 */
export default function GovernmentDashboard() {
  const { allLots, isLoading: isLoadingQueue } = useLotQueue();
  const { marks: onChainMarks, isLoading: isLoadingMarks, refetch: refetchMarks } = useIndustryMarks();
  const [form, setForm] = useState({
    farmerWallet: "",
    farmerId: "",
    markTypeIndex: 0,
    description: "",
    expiryDate: "",
  });

  const farmerWalletValid = isAddress(form.farmerWallet);
  const {
    marks: farmerMarks,
    isLoading: isLoadingFarmerMarks,
    refetch: refetchFarmerMarks,
  } = useFarmerMarks(farmerWalletValid ? form.farmerWallet : null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [revokeError, setRevokeError] = useState("");

  useEffect(() => {
    if (isSuccess) {
      refetchMarks();
      if (farmerWalletValid) refetchFarmerMarks();
      setTimeout(() => {
        setForm({
          farmerWallet: "",
          farmerId: "",
          markTypeIndex: 0,
          description: "",
          expiryDate: "",
        });
        setIsSuccess(false);
      }, 0);
    }
  }, [isSuccess, refetchMarks, refetchFarmerMarks, farmerWalletValid]);

  const validatedCount = allLots.filter((l) => l.status === LotStatus.VALIDATED).length;
  const rejectedCount = allLots.filter((l) => l.status === LotStatus.REJECTED).length;
  const pendingCount = allLots.filter((l) => l.status === LotStatus.PENDING).length;
  const total = allLots.length || 1;

  async function handleIssue(e) {
    e.preventDefault();
    if (!form.farmerWallet || !form.farmerId || !form.expiryDate) return;

    const expiresTimestamp = Math.floor(new Date(form.expiryDate).getTime() / 1000);
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await apiClient.post(
        "/api/marks",
        {
          farmer: form.farmerWallet,
          farmerId: form.farmerId,
          markType: String(Number(form.markTypeIndex)),
          description: form.description || "Official government mark",
          expiresAt: expiresTimestamp,
          metadataURI: "",
        },
        { auth: true }
      );
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(err?.message || "Failed to issue mark");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRevoke(markId) {
    setRevokingId(markId.toString());
    setRevokeError("");
    try {
      await apiClient.put(`/api/marks/${markId.toString()}/revoke`, {}, { auth: true });
      refetchMarks();
    } catch (err) {
      setRevokeError(err?.message || "Failed to revoke mark");
    } finally {
      setRevokingId(null);
    }
  }

  const busy = isSubmitting;

  return (
    <AppLayout role="GOVERNMENT" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-8 max-w-[1024px] mx-auto">
        <PageHeader
          en="Mark Management Dashboard"
          st="Matšoao a Mmuso"
          subtitle="Admin Control Panel — National Wool & Mohair Sector"
          action={
            <Link to="/government/news/compose">
              <Button fullWidth={false} size="sm" icon={<Icon name="campaign" className="!text-base" />}>
                Publish News
              </Button>
            </Link>
          }
        />

        <Card role="government" className="mb-stack-md">
          <p className="text-label-sm text-on-surface-variant uppercase">
            <BilingualText en="Total On-Chain Marks Issued" st="Matšoao Ohle a Kentseng" size="label-sm" />
          </p>
          <p className="text-headline-xl font-bold text-primary">{onChainMarks.length}</p>
          <p className="text-body-sm text-primary mb-4">↗ Registered on Celo Ledger</p>

          <div className="flex items-center gap-4">
            <DonutChart validated={validatedCount} rejected={rejectedCount} pending={pendingCount} total={total} />
            <div className="space-y-1.5 text-body-sm">
              <Legend color="bg-primary" label="Validated" />
              <Legend color="bg-role-validator" label="Pending" />
              <Legend color="bg-role-government" label="Rejected" />
            </div>
          </div>
        </Card>

        <Card role="government" className="mb-stack-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">Lot Status Overview</h2>
            <span className="bg-role-government/15 text-role-government rounded-full px-3 py-1 text-label-sm font-bold">
              {pendingCount} Pending
            </span>
          </div>
          {isLoadingQueue && <p className="text-body-sm text-on-surface-variant">Loading queue stats…</p>}
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatBox value={validatedCount} label="Validated" color="text-primary" />
            <StatBox value={pendingCount} label="Pending" color="text-role-validator" />
            <StatBox value={rejectedCount} label="Rejected" color="text-error" />
          </div>
        </Card>

        <Card role="government" className="mb-stack-lg">
          <form onSubmit={handleIssue} className="space-y-4">
          <h2 className="font-bold flex items-center gap-2 mb-4 text-primary">
            <Icon name="verified" />
            <BilingualText en="Issue an Industry Mark" st="Fana ka Letšoao la Semmuso" size="body-lg" />
          </h2>

          <FormField label="Farmer Wallet Address (Aterese ea Wallet)">
            <input
              value={form.farmerWallet}
              onChange={(e) => setForm({ ...form, farmerWallet: e.target.value })}
              placeholder="0x…"
              required
              disabled={busy}
              className={`${inputClassName} font-mono mb-2`}
            />
          </FormField>
          {farmerWalletValid && (
            <div className="mb-4 bg-surface-container rounded-lg p-3">
              <p className="text-label-sm text-on-surface-variant uppercase mb-2">
                Existing Marks for Farmer (Matšoao a Molemi)
              </p>
              {isLoadingFarmerMarks && (
                <p className="text-body-sm text-on-surface-variant">Loading farmer marks…</p>
              )}
              {!isLoadingFarmerMarks && farmerMarks.length === 0 && (
                <p className="text-body-sm text-on-surface-variant">No on-chain marks for this wallet yet.</p>
              )}
              {!isLoadingFarmerMarks &&
                farmerMarks.map((m) => (
                  <div key={m.markId.toString()} className="text-body-sm py-1 border-b border-outline-variant/40 last:border-0">
                    <span className="font-semibold">{MarkTypeLabel[m.markType]}</span>
                    <span className="text-on-surface-variant"> · ID #{m.markId.toString()}</span>
                  </div>
                ))}
            </div>
          )}
          {!farmerWalletValid && form.farmerWallet && (
            <p className="text-label-sm text-error mb-4">Enter a valid wallet address (0x…)</p>
          )}

          <FormField label="Farmer ID (Nomoro ea Molemi)">
            <input
              value={form.farmerId}
              onChange={(e) => setForm({ ...form, farmerId: e.target.value })}
              placeholder="e.g. LSO-12345"
              required
              disabled={busy}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Mark Type (Mofuta oa Letšoao)">
            <select
              value={form.markTypeIndex}
              onChange={(e) => setForm({ ...form, markTypeIndex: Number(e.target.value) })}
              disabled={busy}
              className={selectClassName}
            >
              <option value={0}>{MarkTypeLabel[0]}</option>
              <option value={1}>{MarkTypeLabel[1]}</option>
              <option value={2}>{MarkTypeLabel[2]}</option>
            </select>
          </FormField>

          <FormField label="Description / Location Description">
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Left ear visual tag, green standard"
              disabled={busy}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Expiry Date (Letsatsi la ho Fela)">
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              required
              disabled={busy}
              className={inputClassName}
            />
          </FormField>

          {submitError && (
            <p className="text-body-sm text-error mb-4">
              {submitError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={busy || !form.farmerWallet || !form.farmerId || !form.expiryDate} loading={busy} icon={<Icon name="check_circle" />}>
            {isSubmitting ? "Submitting..." : "Issue Mark (Etsa Letšoao)"}
          </Button>
          </form>
        </Card>

        <h2 className="text-label-lg text-primary uppercase tracking-widest mb-3">
          On-Chain Issued Marks (Matšoao a Tsoileng)
        </h2>
        {isLoadingMarks && <p className="text-body-sm text-on-surface-variant">Loading marks registry...</p>}
        {!isLoadingMarks && onChainMarks.length === 0 && (
          <p className="text-body-sm text-on-surface-variant font-medium">No marks registered on-chain yet.</p>
        )}
        {revokeError && <p className="text-body-sm text-error mb-3">{revokeError}</p>}
        <div className="space-y-stack-md">
          {onChainMarks.map((m) => (
            <Card key={m.markId.toString()} role="government">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase font-mono">Mark ID #{m.markId.toString()}</p>
                  <p className="font-bold text-body-md text-on-surface">{MarkTypeLabel[m.markType]}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    m.status === MarkStatus.ACTIVE
                      ? "bg-primary/10 text-primary"
                      : m.status === MarkStatus.REVOKED
                        ? "bg-error-container text-error"
                        : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {MarkStatusLabel[m.status] || "Unknown"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-body-sm text-on-surface-variant">
                <div>
                  <span className="text-[10px] uppercase font-bold block">Farmer ID</span>
                  <span className="font-semibold text-on-surface">{m.farmerId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold block">Farmer Wallet</span>
                  <span className="font-semibold text-on-surface">{shorten(m.farmer)}</span>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="text-[10px] uppercase font-bold block">Details</span>
                  <span className="font-semibold text-on-surface">{m.description}</span>
                </div>
                <div className="col-span-2 mt-1 border-t border-outline-variant/40 pt-2 text-[10px]">
                  <span>Issued By: {shorten(m.issuedBy)} · Expires: {new Date(Number(m.expiresAt) * 1000).toLocaleDateString()}</span>
                </div>
              </div>
              {m.status === MarkStatus.ACTIVE && (
                <Button variant="outline-error" size="sm" onClick={() => handleRevoke(m.markId)} disabled={revokingId === m.markId.toString()} loading={revokingId === m.markId.toString()} className="mt-3">
                  Revoke Mark
                </Button>
              )}
            </Card>
          ))}
        </div>
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
