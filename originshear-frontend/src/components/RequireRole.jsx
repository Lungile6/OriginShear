import { Navigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useRole } from "../context/RoleContext";
import { DEV_BYPASS_ROLE_GUARDS } from "../lib/devBypass";

/**
 * Guards a route behind wallet connection + an on-chain role check.
 * - Not connected -> redirect to /connect
 * - Connected but wrong network / no contracts resolved -> /error/wrong-network
 * - Connected, correct network, but missing the required role -> redirectTo
 *   (typically a role-specific "pending access" onboarding screen)
 */
export default function RequireRole({ role, redirectTo, children }) {
  if (DEV_BYPASS_ROLE_GUARDS) {
    return children;
  }

  const location = useLocation();
  const { isConnected } = useAccount();
  const { roles, isLoadingRoles, hasContracts } = useRole();

  if (!isConnected) {
    return <Navigate to="/connect" state={{ from: location, intendedRole: role }} replace />;
  }

  if (!hasContracts) {
    return <Navigate to="/error/wrong-network" replace />;
  }

  if (isLoadingRoles) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!roles.includes(role)) {
    return <Navigate to={redirectTo || "/error/unauthorized"} replace />;
  }

  return children;
}
