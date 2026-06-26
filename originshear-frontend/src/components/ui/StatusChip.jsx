// Maps domain statuses to a consistent chip style across the app:
// HarvestLedger.LotStatus, FarmerMarket.OfferStatus, and generic states.
const STATUS_STYLES = {
  validated: "bg-primary-container text-on-primary-container",
  verified: "bg-primary-container text-on-primary-container",
  completed: "bg-primary-container text-on-primary-container",
  active: "bg-primary-container text-on-primary-container",

  pending: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  "in escrow": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  "payment in escrow": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  urgent: "bg-tertiary-fixed text-on-tertiary-fixed-variant",

  rejected: "bg-error-container text-on-error-container",
  cancelled: "bg-error-container text-on-error-container",
  expired: "bg-error-container text-on-error-container",

  standard: "bg-surface-container-highest text-on-surface-variant",
  listed: "bg-secondary-container text-on-secondary-container",
};

export default function StatusChip({ status, label, className = "" }) {
  const key = (status || "").toLowerCase();
  const style = STATUS_STYLES[key] || STATUS_STYLES.standard;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-label-md font-semibold uppercase tracking-wide ${style} ${className}`}
    >
      {label ?? status}
    </span>
  );
}
