const request = require("supertest");
const jwt = require("jsonwebtoken");

describe("On-chain role authorization (positive path)", () => {
  let app;
  let token;
  let mockValidateLot;
  let mockReleasePayment;
  let mockIssueMark;
  let mockRevokeMark;

  beforeAll(() => {
    jest.resetModules();

    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.HARVEST_LEDGER_ADDRESS = "0x0000000000000000000000000000000000000001";
    process.env.FARMER_MARKET_ADDRESS = "0x0000000000000000000000000000000000000002";
    process.env.INDUSTRY_MARK_REGISTRY_ADDRESS = "0x0000000000000000000000000000000000000003";
    process.env.RELAYER_PRIVATE_KEY = "1".repeat(64);

    mockValidateLot = jest.fn(async () => ({
      hash: "0xvalidate",
      wait: async () => ({ blockNumber: 101 }),
    }));
    mockReleasePayment = jest.fn(async () => ({
      hash: "0xrelease",
      wait: async () => ({ blockNumber: 102 }),
    }));
    mockIssueMark = jest.fn(async () => ({
      hash: "0xissue",
      wait: async () => ({ blockNumber: 103 }),
    }));
    mockRevokeMark = jest.fn(async () => ({
      hash: "0xrevoke",
      wait: async () => ({ blockNumber: 104 }),
    }));

    jest.doMock("../src/lib/onchainRoles", () => ({
      walletHasValidatorRole: jest.fn(async () => true),
      walletHasGovernmentRole: jest.fn(async () => true),
    }));

    jest.doMock("ethers", () => {
      const real = jest.requireActual("ethers");
      return {
        ethers: {
          ...real.ethers,
          JsonRpcProvider: jest.fn(() => ({})),
          Wallet: jest.fn(() => ({})),
          Contract: jest.fn((_address, abi) => {
            const signature = Array.isArray(abi) ? abi[0] : "";
            if (String(signature).includes("validateLot")) {
              return { validateLot: mockValidateLot };
            }
            if (String(signature).includes("releasePayment")) {
              return { releasePayment: mockReleasePayment };
            }
            return {
              issueMark: mockIssueMark,
              revokeMark: mockRevokeMark,
            };
          }),
        },
      };
    });

    app = require("../src/index");
    token = jwt.sign(
      { wallet: "0x000000000000000000000000000000000000dEaD", role: "FARMER" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(() => {
    jest.dontMock("../src/lib/onchainRoles");
    jest.dontMock("ethers");
  });

  it("allows lot validation with validator role", async () => {
    const res = await request(app)
      .put("/api/lots/1/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ approve: true })
      .expect(200);

    expect(res.body.txHash).toBe("0xvalidate");
    expect(mockValidateLot).toHaveBeenCalled();
  });

  it("allows payment release with validator role", async () => {
    const res = await request(app)
      .post("/api/market/offers/1/release")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(res.body.txHash).toBe("0xrelease");
    expect(mockReleasePayment).toHaveBeenCalled();
  });

  it("allows mark issue with government role", async () => {
    const res = await request(app)
      .post("/api/marks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        farmer: "0x000000000000000000000000000000000000dEaD",
        farmerId: "LSO-0001",
        markType: "0",
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        description: "Test mark",
      })
      .expect(201);

    expect(res.body.txHash).toBe("0xissue");
    expect(mockIssueMark).toHaveBeenCalled();
  });

  it("allows mark revoke with government role", async () => {
    const res = await request(app)
      .put("/api/marks/1/revoke")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(res.body.txHash).toBe("0xrevoke");
    expect(mockRevokeMark).toHaveBeenCalled();
  });
});
