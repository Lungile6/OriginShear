/** When true, skip on-chain role guards so all routes are reachable in local dev. */
export const DEV_BYPASS_ROLE_GUARDS =
  import.meta.env.VITE_DEV_BYPASS_ROLE_GUARDS === "true";
