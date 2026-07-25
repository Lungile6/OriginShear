import { Navigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useRole, Role } from "../context/RoleContext";

/**
 * Guards admin routes behind wallet connection + DEFAULT_ADMIN_ROLE.
 */
export default function RequireAdmin({ children }) {
  const location = useLocation();
  const { isConnected } = useAccount();
  const { roles, isLoadingRoles, hasContracts, isAdmin } = useRole();

  if (!isConnected) {
    return <Navigate to="/connect" state={{ from: location, intendedRole: Role.ADMIN }} replace />;
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

  if (!isAdmin && !roles.includes(Role.ADMIN)) {
    return <Navigate to="/error/unauthorized" replace />;
  }

  return children;
}
