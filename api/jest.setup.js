/**
 * Force deterministic API test env before any app module loads.
 * dotenv.config() will not override these (dotenv never overwrites existing keys).
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.AUTH_CHALLENGE_TTL_SECONDS =
  process.env.AUTH_CHALLENGE_TTL_SECONDS || "120";

// Role-guard tests must exercise real middleware paths, not local-dev bypass.
process.env.DEV_BYPASS_ROLE_GUARDS = "false";

// Avoid live RPC during login (prevents beforeAll timeouts on slow networks).
process.env.ENABLE_ONCHAIN_ROLE_RESOLUTION = "false";
