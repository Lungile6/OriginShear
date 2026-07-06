import Button from "./Button";

/**
 * On-chain action confirmation modal from Stitch validator_view_lnwmga.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  lotRef,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  const titleClass = confirmVariant === "danger" ? "text-error" : "text-primary";
  const confirmBtnVariant = confirmVariant === "danger" ? "danger" : "primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-label="Close" />
      <div className="bg-surface w-full max-w-sm rounded-xl border border-outline-variant shadow-xl z-10 overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h3 className={`text-headline-sm font-bold ${titleClass}`}>{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-body-md text-on-surface">{message}</p>
          {lotRef && (
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Lot Reference: <span className="font-bold">{lotRef}</span>
            </p>
          )}
        </div>
        <div className="p-4 flex gap-3">
          <Button variant="outline" fullWidth onClick={onCancel} disabled={loading}>
            Cancel (Hlakola)
          </Button>
          <Button variant={confirmBtnVariant} fullWidth onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
