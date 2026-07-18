const request = require("supertest");
const { Wallet } = require("ethers");

async function issueToken(app) {
  const wallet = Wallet.createRandom();
  const challengeRes = await request(app)
    .post("/api/auth/challenge")
    .send({ wallet: wallet.address });
  const signature = await wallet.signMessage(challengeRes.body.message);
  const loginRes = await request(app).post("/api/auth/login").send({
    wallet: wallet.address,
    nonce: challengeRes.body.nonce,
    signature,
  });
  return loginRes.body.token;
}

describe("On-chain role authorization", () => {
  let app;
  let token;

  beforeAll(async () => {
    jest.resetModules();
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.AUTH_CHALLENGE_TTL_SECONDS = "120";
    // Must stay off so mocked role denials return 403 instead of hitting chain.
    process.env.DEV_BYPASS_ROLE_GUARDS = "false";
    process.env.ENABLE_ONCHAIN_ROLE_RESOLUTION = "false";

    jest.doMock("../src/lib/onchainRoles", () => ({
      walletHasValidatorRole: jest.fn(async () => false),
      walletHasGovernmentRole: jest.fn(async () => false),
    }));

    app = require("../src/index");
    token = await issueToken(app);
  });

  afterAll(() => {
    jest.dontMock("../src/lib/onchainRoles");
  });

  it("rejects lot validation when wallet lacks validator role", async () => {
    await request(app)
      .put("/api/lots/1/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ approve: true })
      .expect(403);
  });

  it("rejects payment release when wallet lacks validator role", async () => {
    await request(app)
      .post("/api/market/offers/1/release")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(403);
  });

  it("rejects mark issue when wallet lacks government role", async () => {
    await request(app)
      .post("/api/marks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        farmer: "0x000000000000000000000000000000000000dEaD",
        farmerId: "LSO-0001",
        markType: "0",
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      })
      .expect(403);
  });

  it("rejects mark revoke when wallet lacks government role", async () => {
    await request(app)
      .put("/api/marks/1/revoke")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(403);
  });
});
