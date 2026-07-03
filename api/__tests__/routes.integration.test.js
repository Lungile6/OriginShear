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

describe("API route behavior", () => {
  let app;
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.AUTH_CHALLENGE_TTL_SECONDS = "120";
    app = require("../src/index");
    token = await issueToken(app);
  });

  it("authenticates and verifies JWT", async () => {
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verifyRes = await request(app)
      .post("/api/auth/verify")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(verifyRes.body.valid).toBe(true);
    expect(verifyRes.body.user).toHaveProperty("wallet");
  });

  it("returns health status without auth", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
  });

  it("rejects invalid status filter early", async () => {
    const res = await request(app)
      .get("/api/lots?status=not-a-status")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(res.body.error).toMatch(/Invalid status/i);
  });

  it("returns wallet-required guidance for lot registration proxy", async () => {
    const res = await request(app)
      .post("/api/lots")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fibreType: "0",
        grade: "0",
        weightGrams: 1000,
        gpsZone: "QTH-ZONE-01",
        seasonYear: "2026-A",
      })
      .expect(501);

    expect(res.body.contractMethod).toBe("HarvestLedger.registerLot");
  });

  it("returns wallet-required guidance for buyer purchase proxy", async () => {
    const res = await request(app)
      .post("/api/market/offers/1/purchase")
      .set("Authorization", `Bearer ${token}`)
      .expect(501);

    expect(res.body.contractMethod).toBe("FarmerMarket.purchaseLot");
  });
});
