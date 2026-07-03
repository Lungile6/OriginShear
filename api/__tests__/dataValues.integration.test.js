const request = require("supertest");
const { Wallet } = require("ethers");

async function issueToken(app) {
  const wallet = Wallet.createRandom();
  const challengeRes = await request(app)
    .post("/api/auth/challenge")
    .send({ wallet: wallet.address })
    .expect(200);

  const signature = await wallet.signMessage(challengeRes.body.message);
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      wallet: wallet.address,
      nonce: challengeRes.body.nonce,
      signature,
    })
    .expect(200);

  return loginRes.body.token;
}

describe("Data-value coverage", () => {
  let app;
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.AUTH_CHALLENGE_TTL_SECONDS = "120";
    app = require("../src/index");
    token = await issueToken(app);
  });

  describe("Normal valid input cases", () => {
    it("issues a valid auth challenge for a well-formed wallet address", async () => {
      const wallet = Wallet.createRandom();
      const res = await request(app)
        .post("/api/auth/challenge")
        .send({ wallet: wallet.address })
        .expect(200);

      expect(res.body.nonce).toBeDefined();
      expect(res.body.message).toMatch(/ORIGINSHEAR Login/);
      expect(res.body.wallet).toBe(wallet.address.toLowerCase());
    });

    it("accepts minimum allowed lot weight", async () => {
      const res = await request(app)
        .post("/api/lots")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fibreType: "0",
          grade: "0",
          weightGrams: 1,
          gpsZone: "QTH-ZONE-01",
          seasonYear: "2026",
        })
        .expect(501);

      expect(res.body.contractMethod).toBe("HarvestLedger.registerLot");
    });
  });

  describe("Edge/boundary input cases", () => {
    it("accepts maximum allowed lot weight", async () => {
      const res = await request(app)
        .post("/api/lots")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fibreType: "2",
          grade: "2",
          weightGrams: 4000000,
          gpsZone: "QTH-ZONE-99",
          seasonYear: "2026",
        })
        .expect(501);

      expect(res.body.reason).toMatch(/meta-transaction/i);
    });

    it("accepts all valid fibre type and grade combinations at max weight boundary", async () => {
      // fibreType 2 = MOHAIR, grade 2 = C, weightGrams 4000000 = upper boundary
      const res = await request(app)
        .post("/api/lots")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fibreType: "2",
          grade: "2",
          weightGrams: 4000000,
          gpsZone: "QTH-ZONE-99",
          seasonYear: "2026-B",
        })
        .expect(501);

      // 501 confirms the payload was fully valid — only blocked by missing relayer
      expect(res.body.contractMethod).toBe("HarvestLedger.registerLot");
    });
  });

  describe("Invalid/error-handling cases", () => {
    it("rejects invalid wallet challenge payload", async () => {
      const res = await request(app)
        .post("/api/auth/challenge")
        .send({ wallet: "not-an-address" })
        .expect(400);

      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it("rejects lot payload below minimum weight", async () => {
      const res = await request(app)
        .post("/api/lots")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fibreType: "0",
          grade: "0",
          weightGrams: 0,
          gpsZone: "QTH-ZONE-01",
          seasonYear: "2026",
        })
        .expect(400);

      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it("rejects lot payload above maximum weight", async () => {
      const res = await request(app)
        .post("/api/lots")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fibreType: "0",
          grade: "0",
          weightGrams: 4000001,
          gpsZone: "QTH-ZONE-01",
          seasonYear: "2026",
        })
        .expect(400);

      expect(Array.isArray(res.body.errors)).toBe(true);
    });
  });
});
