import TopAppBar from "../components/nav/TopAppBar";
import Button from "../components/ui/Button";
import { useApiAuth } from "../hooks/useApiAuth";

const PROTECTED_ROLES = new Set(["FARMER", "VALIDATOR", "GOVERNMENT", "ADMIN"]);

/**
 * Shared chrome for all authenticated, role-bound screens: fixed top app
 * bar, scrollable content area, fixed bottom nav. Public/auth screens
 * (landing, splash, role gate) render without this layout.
 */
export default function AppLayout({ role, title, children }) {
  const needsAuth = PROTECTED_ROLES.has(role);
  const { authError, isAuthenticating, isChecking, needsSignIn, signIn } = useApiAuth({
    enabled: needsAuth,
  });

  const showBanner = needsAuth && (authError || needsSignIn || isChecking || isAuthenticating);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-on-surface" data-role={role || ""}>
      <div className="role-accent-bar fixed top-0 inset-x-0 h-0.5 z-[60]" aria-hidden="true" />
      <TopAppBar title={title} role={role} />
      {showBanner && (
        <div
          className={`px-4 py-2 text-body-sm ${
            authError
              ? "bg-error-container text-on-error-container"
              : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          {isChecking ? (
            <p>Checking API session…</p>
          ) : needsSignIn || authError ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {authError ||
                  "Sign in to OriginShear to use protected actions. Your wallet will ask you to approve a login message."}
              </p>
              <Button
                type="button"
                variant={authError ? "danger" : "primary"}
                size="sm"
                fullWidth={false}
                loading={isAuthenticating}
                onClick={signIn}
                className="shrink-0"
              >
                Sign in to OriginShear
              </Button>
            </div>
          ) : (
            <p>Signing in… Approve the signature request in your wallet if prompted.</p>
          )}
        </div>
      )}
      <main className="flex-1 pt-14 pb-28 max-w-[1024px] w-full mx-auto">{children}</main>
    </div>
  );
}
