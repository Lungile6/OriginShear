import LiveBadge from "./LiveBadge";

/**
 * Shared dashboard identity row (Stitch: role portal header strip).
 */
export default function DashboardHeader({ subtitle, detail, role = "FARMER" }) {
  const roleDot = {
    FARMER: "bg-role-farmer",
    VALIDATOR: "bg-role-validator",
    GOVERNMENT: "bg-role-government",
    BUYER: "bg-role-buyer",
  };

  return (
    <div className="px-4 py-3 flex justify-between items-center">
      <div>
        {subtitle && (
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{subtitle}</p>
        )}
        {detail && (
          <p className="text-label-sm font-bold flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full shrink-0 ${roleDot[role] || roleDot.FARMER}`} />
            {detail}
          </p>
        )}
      </div>
      <LiveBadge />
    </div>
  );
}
