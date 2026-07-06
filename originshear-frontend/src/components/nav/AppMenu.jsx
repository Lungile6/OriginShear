import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { GLOBAL_MENU_LINKS, NAV_BY_ROLE } from "./navConfig";

export default function AppMenu({ role = "AUTH" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const roleLinks = NAV_BY_ROLE[role] || [];

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeAndGo(to, options) {
    setOpen(false);
    navigate(to, options);
  }

  function scrollToProtocol() {
    setOpen(false);
    if (window.location.pathname === "/") {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/", { state: { scrollTo: "how-it-works" } });
  }

  const menuOverlay = open ? (
    <div
      className="fixed inset-0 z-[9999] bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      onClick={() => setOpen(false)}
    >
      <div
        className="fixed inset-y-0 left-0 z-[10000] w-[min(100%,320px)] bg-surface p-5 shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="font-bold text-primary uppercase">Menu</span>
          <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant font-semibold">
            Close
          </button>
        </div>

        {roleLinks.length > 0 && (
          <nav className="mb-4">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              {role === "PUBLIC" || role === "AUTH" ? "Quick links" : "Your portal"}
            </p>
            <div className="space-y-1">
              {roleLinks.map((link) => (
                <MenuLink
                  key={link.to}
                  label={link.label}
                  subtitle={link.st}
                  onClick={() => closeAndGo(link.to)}
                />
              ))}
            </div>
          </nav>
        )}

        <nav>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
            App
          </p>
          <div className="space-y-1">
            {GLOBAL_MENU_LINKS.map((link) => (
              <MenuLink key={link.to} label={link.label} onClick={() => closeAndGo(link.to)} />
            ))}
            <MenuLink label="How It Works" onClick={scrollToProtocol} />
          </div>
        </nav>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 text-on-surface-variant"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {menuOverlay && createPortal(menuOverlay, document.body)}
    </>
  );
}

function MenuLink({ label, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-3 rounded-lg hover:bg-surface-container active:bg-surface-container-high transition-colors"
    >
      <span className="font-semibold text-body-md block">{label}</span>
      {subtitle && <span className="text-label-sm text-on-surface-variant">{subtitle}</span>}
    </button>
  );
}
