import TopAppBar from "../components/nav/TopAppBar";
import { useApiAuth } from "../hooks/useApiAuth";

const PROTECTED_ROLES = new Set(["FARMER", "VALIDATOR", "GOVERNMENT"]);

/**
 * Shared chrome for all authenticated, role-bound screens: fixed top app
 * bar, scrollable content area, fixed bottom nav. Public/auth screens
 * (landing, splash, role gate) render without this layout.
 */
export default function AppLayout({ role, title, children }) {
  const needsAuth = PROTECTED_ROLES.has(role);
  const { authError, isAuthenticating } = useApiAuth({ enabled: needsAuth });

  return (
    <div className="min-h-dvh flex flex-col bg-background text-on-surface" data-role={role || ""}>
      <div className="role-accent-bar fixed top-0 inset-x-0 h-0.5 z-[60]" aria-hidden="true" />
      <TopAppBar title={title} role={role} />
      {needsAuth && (authError || isAuthenticating) && (
        <div
          className={`px-4 py-2 text-body-sm ${
            authError ? "bg-error-container text-on-error-container" : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          {authError ||
            "Signing in to the API… Approve the signature request in your wallet if prompted."}
        </div>
      )}
      <main className="flex-1 pt-14 pb-28 max-w-[1024px] w-full mx-auto">{children}</main>
    </div>
  );
}
