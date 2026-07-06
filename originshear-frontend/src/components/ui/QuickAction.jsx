import { Link } from "react-router-dom";
import Icon from "./Icon";

/** Material icon names per quick-action key (Stitch farmer_dashboard). */
const ACTION_ICONS = {
  register: "edit_document",
  lots: "inventory_2",
  qr: "qr_code_scanner",
  market: "trending_up",
  history: "history",
  news: "gavel",
  queue: "pending_actions",
  audit: "history",
  escrow: "payments",
};

/**
 * 2×2 quick-action tile from the Stitch dashboard spec.
 */
export default function QuickAction({ to, icon, title, st, compact = false }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-start bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm active:scale-95 transition-transform justify-between ${
        compact ? "p-3 h-24" : "p-4 h-24"
      }`}
    >
      <Icon name={ACTION_ICONS[icon] || icon} className="text-primary" size={32} />
      <div className="text-left">
        <p className={`font-bold text-on-surface ${compact ? "text-[12px] leading-tight" : "text-body-sm"}`}>
          {title}
        </p>
        {st && (
          <p className={`text-on-surface-variant uppercase ${compact ? "text-[9px]" : "text-[10px]"}`}>{st}</p>
        )}
      </div>
    </Link>
  );
}
