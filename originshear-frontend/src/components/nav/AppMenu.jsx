import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { shorten } from "../../lib/utils";
import Icon from "../ui/Icon";
import { GLOBAL_MENU_LINKS, NAV_BY_ROLE } from "./navConfig";

const ROLE_META = {
  PUBLIC: {
    label: "Public",
    accent: "bg-primary",
    soft: "bg-primary/10 text-primary",
    tagline: "Lesotho wool & mohair ledger",
  },
  AUTH: {
    label: "Welcome",
    accent: "bg-primary",
    soft: "bg-primary/10 text-primary",
    tagline: "Connect to enter your portal",
  },
  FARMER: {
    label: "Farmer portal",
    accent: "bg-role-farmer",
    soft: "bg-role-farmer/15 text-role-farmer",
    tagline: "Register lots · sell with proof",
  },
  VALIDATOR: {
    label: "Validator portal",
    accent: "bg-role-validator",
    soft: "bg-role-validator/15 text-role-validator",
    tagline: "Grade · clear · release escrow",
  },
  GOVERNMENT: {
    label: "Ministry portal",
    accent: "bg-role-government",
    soft: "bg-role-government/20 text-[#8a5a00]",
    tagline: "Marks · news · oversight",
  },
  BUYER: {
    label: "Buyer portal",
    accent: "bg-role-buyer",
    soft: "bg-role-buyer/15 text-role-buyer",
    tagline: "Marketplace · verify origin",
  },
};

const CLOSE_MS = 280;

export default function AppMenu({ role = "AUTH" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const titleId = useId();
  const closeBtnRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const roleLinks = NAV_BY_ROLE[role] || [];
  const meta = ROLE_META[role] || ROLE_META.AUTH;
  const portalLabel =
    role === "PUBLIC" || role === "AUTH" ? "Quick links" : "Your portal";

  function openMenu() {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }

  function closeMenu() {
    setVisible(false);
    window.setTimeout(() => setMounted(false), CLOSE_MS);
  }

  function closeAndGo(to, options) {
    closeMenu();
    window.setTimeout(() => navigate(to, options), 120);
  }

  function scrollToProtocol() {
    closeMenu();
    window.setTimeout(() => {
      if (window.location.pathname === "/") {
        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      navigate("/", { state: { scrollTo: "how-it-works" } });
    }, 120);
  }

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  const menuOverlay = mounted ? (
    <div
      className={`app-menu-overlay fixed inset-0 z-[9999] ${visible ? "is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={closeMenu}
    >
      <div
        className={`app-menu-drawer fixed inset-y-0 left-0 z-[10000] flex w-[min(100%,22rem)] flex-col bg-surface shadow-2xl ${
          visible ? "is-open" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1 shrink-0 ${meta.accent}`} aria-hidden="true" />

        <div className="relative overflow-hidden px-5 pb-5 pt-4">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/[0.07]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-tertiary/[0.06]"
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
                  <Icon name="grass" size={26} />
                </div>
                <div className="min-w-0">
                  <p
                    id={titleId}
                    className="truncate text-headline-sm font-bold uppercase tracking-tight text-primary"
                  >
                    OriginShear
                  </p>
                  <p className="truncate text-label-sm text-on-surface-variant">{meta.tagline}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-semibold ${meta.soft}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.accent}`} />
                {meta.label}
              </span>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeMenu}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors active:bg-surface-container-high"
              aria-label="Close menu"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 hide-scrollbar">
          {roleLinks.length > 0 && (
            <nav className="mb-5" aria-label={portalLabel}>
              <p className="mb-2 px-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
                {portalLabel}
              </p>
              <div className="space-y-1">
                {roleLinks.map((link, i) => (
                  <MenuLink
                    key={link.to}
                    icon={link.icon}
                    label={link.label}
                    subtitle={link.st}
                    active={isActivePath(location.pathname, link.to)}
                    style={{ animationDelay: `${40 + i * 35}ms` }}
                    animated={visible}
                    onClick={() => closeAndGo(link.to)}
                  />
                ))}
              </div>
            </nav>
          )}

          <nav aria-label="App">
            <p className="mb-2 px-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
              Explore
            </p>
            <div className="space-y-1">
              {GLOBAL_MENU_LINKS.map((link, i) => (
                <MenuLink
                  key={link.to}
                  icon={link.icon}
                  label={link.label}
                  active={isActivePath(location.pathname, link.to)}
                  style={{ animationDelay: `${80 + (roleLinks.length + i) * 35}ms` }}
                  animated={visible}
                  onClick={() => closeAndGo(link.to)}
                />
              ))}
              <MenuLink
                icon="route"
                label="How It Works"
                style={{
                  animationDelay: `${80 + (roleLinks.length + GLOBAL_MENU_LINKS.length) * 35}ms`,
                }}
                animated={visible}
                onClick={scrollToProtocol}
              />
            </div>
          </nav>
        </div>

        <div className="shrink-0 border-t border-outline-variant/50 bg-surface-container-low px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="account_balance_wallet" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-sm font-semibold text-on-surface">
                  {shorten(address)}
                </p>
                <p className="text-label-sm text-on-surface-variant">Wallet connected</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  closeMenu();
                }}
                className="rounded-lg px-2.5 py-1.5 text-label-sm font-semibold text-error transition-colors active:bg-error-container"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => closeAndGo("/connect")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-body-sm font-semibold text-on-primary transition-transform active:scale-[0.98]"
            >
              <Icon name="account_balance_wallet" size={20} />
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container"
        aria-label="Open menu"
        aria-expanded={mounted && visible}
        aria-haspopup="dialog"
      >
        <span className={`app-menu-burger ${mounted && visible ? "is-open" : ""}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {menuOverlay && createPortal(menuOverlay, document.body)}
    </>
  );
}

function isActivePath(pathname, to) {
  if (pathname === to) return true;
  // Nested flows (register wizard, lot detail under a section)
  if (to !== "/" && pathname.startsWith(`${to}/`)) {
    const leafRoutes = new Set(
      Object.values(NAV_BY_ROLE)
        .flat()
        .map((l) => l.to)
        .concat(GLOBAL_MENU_LINKS.map((l) => l.to)),
    );
    // Prefer the most specific matching nav item — skip parents that have a
    // more specific sibling also matching this path.
    for (const candidate of leafRoutes) {
      if (candidate !== to && candidate.startsWith(`${to}/`) && pathname.startsWith(candidate)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function MenuLink({ icon, label, subtitle, active, onClick, style, animated }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`app-menu-link group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        animated ? "is-animated" : ""
      } ${
        active
          ? "bg-primary text-on-primary shadow-sm"
          : "text-on-surface active:bg-surface-container-high"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          active
            ? "bg-white/15 text-on-primary"
            : "bg-surface-container text-primary group-active:bg-surface-container-highest"
        }`}
      >
        <Icon name={icon || "chevron_right"} filled={active} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-body-md font-semibold ${active ? "" : ""}`}>
          {label}
        </span>
        {subtitle && (
          <span
            className={`block truncate text-label-sm ${
              active ? "text-on-primary/75" : "text-on-surface-variant"
            }`}
          >
            {subtitle}
          </span>
        )}
      </span>
      <Icon
        name="chevron_right"
        size={18}
        className={active ? "text-on-primary/70" : "text-outline"}
      />
    </button>
  );
}
