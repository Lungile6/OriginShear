/**
 * Pulsing "LIVE LEDGER" indicator from Stitch dashboard headers.
 */
export default function LiveBadge({ className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      <span className="text-label-sm font-bold text-primary">LIVE LEDGER</span>
    </div>
  );
}
