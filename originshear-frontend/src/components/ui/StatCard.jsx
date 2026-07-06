/**
 * Horizontal stat tile used in dashboard stat rails (Stitch: "Metric Cards").
 */
export default function StatCard({
  label,
  st,
  value,
  unit,
  highlight = false,
  accent = "primary",
  className = "",
}) {
  const accentClasses = {
    primary: highlight ? "text-primary animate-pulse" : "text-on-surface",
    validator: highlight ? "text-role-validator animate-pulse" : "text-on-surface",
    buyer: highlight ? "text-role-buyer animate-pulse" : "text-on-surface",
  };

  const borderClass = highlight
    ? accent === "validator"
      ? "border-role-validator/40"
      : "border-primary/40"
    : "border-outline-variant";

  return (
    <div
      className={`min-w-[150px] bg-surface-container-lowest border ${borderClass} p-4 rounded-xl shadow-sm shrink-0 ${className}`}
    >
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
      <div className={`text-headline-md font-bold mt-1 ${accentClasses[accent] || accentClasses.primary}`}>
        {value}
        {unit && <span className="text-body-sm"> {unit}</span>}
      </div>
      {st && <div className="text-label-sm text-primary mt-1">{st}</div>}
    </div>
  );
}
