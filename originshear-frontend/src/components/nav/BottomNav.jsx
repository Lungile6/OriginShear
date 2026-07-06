import { NavLink } from "react-router-dom";
import { NAV_BY_ROLE } from "./navConfig";
import Icon from "../ui/Icon";

/**
 * Mobile bottom nav — matches Stitch export pill-active pattern.
 */
export default function BottomNav({ role }) {
  const tabs = NAV_BY_ROLE[role] || [];
  if (tabs.length === 0) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-outline-variant shadow-sm pb-safe md:max-w-[1024px] md:mx-auto">
      <div className="flex justify-around items-center px-2 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[56px] min-h-[48px] rounded-xl transition-all duration-100 active:opacity-80 ${
                isActive
                  ? "bg-primary text-on-primary scale-90"
                  : "text-on-surface-variant"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={tab.icon} filled={isActive} size={24} />
                <span className={`text-[10px] leading-tight text-center ${isActive ? "font-bold" : ""}`}>
                  {tab.st ? `${tab.label} (${tab.st})` : tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
