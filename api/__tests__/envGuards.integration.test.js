const request = require("supertest");
const jwt = require("jsonwebtoken");
const { silenceExpectedConsoleErrors } = require("../test-utils/console");

function buildToken(secret) {
  return jwt.sign(
    { wallet: "0x000000000000000000000000000000000000dEaD", role: "FARMER" },
    secret,
    { expiresIn: "1h" }
  );
}

describe("Relayer env guardrails", () => {
  let restoreConsole = null;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("../src/lib/onchainRoles", () => ({
      walletHasValidatorRole: jest.fn(async () => true),
      walletHasGovernmentRole: jest.fn(async () => true),
    }));

    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.AUTH_CHALLENGE_TTL_SECONDS = "120";

    restoreConsole = silenceExpectedConsoleErrors([
      /Validate lot error/i,
      /Issue mark error/i,
      /RELAYER_PRIVATE_KEY/i,
      /INDUSTRY_MARK_REGISTRY_ADDRESS/i,
    ]);
  });

  afterEach(() => {
    if (restoreConsole) restoreConsole();
    jest.dontMock("../src/lib/onchainRoles");
  });

  it("returns 501 when RELAYER_PRIVATE_KEY is missing for lot validation", async () => {
    process.env.HARVEST_LEDGER_ADDRESS = "0x0000000000000000000000000000000000000001";
    process.env.RELAYER_PRIVATE_KEY = "";

    const app = require("../src/index");
    const token = buildToken(process.env.JWT_SECRET);

    const res = await request(app)
      .put("/api/lots/1/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ approve: true })
      .expect(501);

    expect(res.body.error).toMatch(/RELAYER_PRIVATE_KEY/i);
  });

  it("returns 500 when INDUSTRY_MARK_REGISTRY_ADDRESS is missing for mark issue", async () => {
    process.env.INDUSTRY_MARK_REGISTRY_ADDRESS = "";
    process.env.RELAYER_PRIVATE_KEY = "1".repeat(64);

    const app = require("../src/index");
    const token = buildToken(process.env.JWT_SECRET);

    const res = await request(app)
      .post("/api/marks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        farmer: "0x000000000000000000000000000000000000dEaD",
        farmerId: "LSO-0001",
        markType: "0",
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      })
      .expect(500);

    expect(res.body.error).toMatch(/INDUSTRY_MARK_REGISTRY_ADDRESS/i);
  });
});
