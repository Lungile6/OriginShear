import { NavLink } from "react-router-dom";

// Tab definitions per role, matching the documented navigation structure
// (Home / Register / My Lots / Gov News / Market, visible-to varies by role).
const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  register: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" strokeLinejoin="round" />
      <path d="M14 3v6h6M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  ),
  lots: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <rect x="4" y="7" width="16" height="13" rx="1.5" />
      <path d="M4 11h16M9 4h6l1.5 3h-9z" strokeLinejoin="round" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 11v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3M3 11l13-6v14L3 13" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M16 9a3 3 0 0 1 0 6" strokeLinecap="round" />
    </svg>
  ),
  market: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 17 9 9l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" />
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.5" />
      <circle cx="4.5" cy="12" r="1.5" />
      <circle cx="4.5" cy="18" r="1.5" />
    </svg>
  ),
  marks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M12 3 4 6.5V12c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6.5z" strokeLinejoin="round" />
    </svg>
  ),
};

const NAV_BY_ROLE = {
  FARMER: [
    { to: "/farmer", label: "Home", st: "Lae", icon: "home" },
    { to: "/farmer/register", label: "Register", st: "Ngolisa", icon: "register" },
    { to: "/farmer/lots", label: "My Lots", st: "Loto", icon: "lots" },
    { to: "/farmer/news", label: "News", st: "Litaba", icon: "news" },
    { to: "/farmer/market", label: "Market", st: "Mmaraka", icon: "market" },
  ],
  VALIDATOR: [
    { to: "/validator", label: "Queue", st: "Letlelo", icon: "queue" },
    { to: "/validator/audit", label: "Audit Log", st: "Tlaleho", icon: "history" },
  ],
  GOVERNMENT: [
    { to: "/government", label: "Marks", st: "Matšoao", icon: "marks" },
    { to: "/government/news", label: "News", st: "Litaba", icon: "news" },
  ],
  BUYER: [
    { to: "/verify", label: "Verify", st: "Netefatsa", icon: "queue" },
  ],
};

export default function BottomNav({ role }) {
  const tabs = NAV_BY_ROLE[role] || [];
  if (tabs.length === 0) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-outline-variant pb-safe">
      <div className="flex justify-around items-center h-14 px-2 max-w-[1024px] mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg min-w-touch-target-min transition-colors ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant active:bg-surface-container"
              }`
            }
          >
            {ICONS[tab.icon]}
            <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
