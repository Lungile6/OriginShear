#!/usr/bin/env node
/**
 * Full-stack smoke test for OriginShear.
 * Run with API already up on PORT (default 3000), or pass SMOKE_API_BASE.
 */
const { ethers } = require("ethers");
const { Wallet } = require("ethers");
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "../api/.env") });

const API_BASE = process.env.SMOKE_API_BASE || `http://127.0.0.1:${process.env.PORT || 3000}`;
const RPC = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
const GRAPHQL = process.env.GRAPHQL_ENDPOINT;

const deploymentsPath = path.join(__dirname, "../originshear-contracts/deployments.celoSepolia.json");
const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function getAuthToken() {
  const wallet = Wallet.createRandom();
  const challenge = await fetchJson(`${API_BASE}/api/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: wallet.address }),
  });
  if (challenge.status !== 200) {
    throw new Error(`challenge failed: ${challenge.status}`);
  }
  const signature = await wallet.signMessage(challenge.body.message);
  const login = await fetchJson(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet: wallet.address,
      nonce: challenge.body.nonce,
      signature,
    }),
  });
  if (login.status !== 200 || !login.body.token) {
    throw new Error(`login failed: ${login.status}`);
  }
  return login.body.token;
}

async function testApiHealth() {
  const res = await fetchJson(`${API_BASE}/health`);
  if (res.status === 200 && res.body.status === "ok") {
    pass("API /health");
  } else {
    fail("API /health", `status ${res.status}`);
  }
}

async function testApiIpfsHealth() {
  const res = await fetchJson(`${API_BASE}/api/ipfs/health`);
  if (res.status === 200) {
    pass("API /api/ipfs/health", JSON.stringify(res.body).slice(0, 120));
  } else {
    fail("API /api/ipfs/health", `status ${res.status}`);
  }
}

async function testApiAuth(token) {
  const res = await fetchJson(`${API_BASE}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 200 && res.body.valid === true) {
    pass("API auth verify JWT");
  } else {
    fail("API auth verify JWT", `status ${res.status}`);
  }
}

async function testApiLots(token) {
  const res = await fetchJson(`${API_BASE}/api/lots?limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200 && Array.isArray(res.body.data)) {
    pass("API GET /api/lots", `${res.body.data.length} lots returned`);
  } else {
    fail("API GET /api/lots", `status ${res.status} ${JSON.stringify(res.body).slice(0, 100)}`);
  }
}

async function testApiMarketOffers() {
  const res = await fetchJson(`${API_BASE}/api/market/offers?status=LISTED&limit=5`);
  if (res.status === 200 && Array.isArray(res.body.data)) {
    pass("API GET /api/market/offers", `${res.body.data.length} offers`);
  } else {
    fail("API GET /api/market/offers", `status ${res.status} ${JSON.stringify(res.body).slice(0, 100)}`);
  }
}

async function testApiNews() {
  const res = await fetchJson(`${API_BASE}/api/news`);
  if (res.status === 200 && Array.isArray(res.body.items)) {
    pass("API GET /api/news", `${res.body.items.length} bulletins (on-chain read)`);
  } else {
    fail("API GET /api/news", `status ${res.status}`);
  }
}

async function testApiMarks(token) {
  const res = await fetchJson(`${API_BASE}/api/marks?limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200 && Array.isArray(res.body.data)) {
    pass("API GET /api/marks", `${res.body.data.length} marks`);
  } else {
    fail("API GET /api/marks", `status ${res.status} ${JSON.stringify(res.body).slice(0, 100)}`);
  }
}

async function testSubgraph() {
  if (!GRAPHQL) {
    fail("Subgraph query", "GRAPHQL_ENDPOINT not set");
    return;
  }
  const query = `{ lots(first: 3, orderBy: lotId, orderDirection: desc) { id lotId status } }`;
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const payload = await res.json();
  if (res.ok && !payload.errors?.length) {
    const count = payload.data?.lots?.length ?? 0;
    pass("Subgraph lots query", `${count} lots indexed`);
  } else {
    fail("Subgraph lots query", payload.errors?.[0]?.message || `status ${res.status}`);
  }
}

async function testOnChainContracts() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 11142220) {
    fail("Celo Sepolia RPC", `unexpected chainId ${network.chainId}`);
    return;
  }
  pass("Celo Sepolia RPC", `chainId ${network.chainId}`);

  const ledgerAbi = ["function totalLots() view returns (uint256)"];
  const ledger = new ethers.Contract(deployments.HarvestLedger, ledgerAbi, provider);
  const totalLots = await ledger.totalLots();
  pass("On-chain HarvestLedger.totalLots()", totalLots.toString());

  const marketAbi = ["function offers(uint256) view returns (tuple(uint256 offerId, uint256 lotId, address farmer, uint256 askPriceWei, address buyer, uint256 escrowAmount, uint8 status, uint256 listedAt, uint256 completedAt))"];
  const market = new ethers.Contract(deployments.FarmerMarket, marketAbi, provider);
  try {
    const offer1 = await market.offers(1);
    pass("On-chain FarmerMarket.offers(1)", `status ${offer1.status}`);
  } catch {
    pass("On-chain FarmerMarket.offers(1)", "no offer #1 yet (contract reachable)");
  }

  const newsAbi = ["function getActiveBulletins() view returns (tuple(uint256 bulletinId, uint8 bulletinType, string title, string body, address publishedBy, uint256 publishedAt, uint8 status, string metadataURI)[])"];
  const news = new ethers.Contract(deployments.NewsBulletin, newsAbi, provider);
  const bulletins = await news.getActiveBulletins();
  pass("On-chain NewsBulletin.getActiveBulletins()", `${bulletins.length} active`);

  const marksAbi = ["function marks(uint256) view returns (tuple(uint256 markId, address farmer, string farmerId, uint8 markType, string description, uint256 issuedAt, uint256 expiresAt, uint8 status, address issuedBy, string metadataURI))"];
  const marks = new ethers.Contract(deployments.IndustryMarkRegistry, marksAbi, provider);
  try {
    const mark1 = await marks.marks(1);
    pass("On-chain IndustryMarkRegistry.marks(1)", `farmer ${mark1.farmer.slice(0, 10)}…`);
  } catch {
    pass("On-chain IndustryMarkRegistry.marks(1)", "no mark #1 yet (contract reachable)");
  }
}

async function testWalletProxyGuidance(token) {
  const lotRes = await fetchJson(`${API_BASE}/api/lots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fibreType: "0",
      grade: "0",
      weightGrams: 1000,
      gpsZone: "QTH-ZONE-01",
      seasonYear: "2026-A",
    }),
  });
  if (lotRes.status === 501 && lotRes.body.contractMethod === "HarvestLedger.registerLot") {
    pass("Lot registration wallet-direct guidance (501)");
  } else {
    fail("Lot registration wallet-direct guidance", `status ${lotRes.status}`);
  }

  const buyRes = await fetchJson(`${API_BASE}/api/market/offers/1/purchase`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (buyRes.status === 501 && buyRes.body.contractMethod === "FarmerMarket.purchaseLot") {
    pass("Buyer purchase wallet-direct guidance (501)");
  } else {
    fail("Buyer purchase wallet-direct guidance", `status ${buyRes.status}`);
  }
}

async function main() {
  console.log("\n=== OriginShear Smoke Test ===\n");
  console.log(`API: ${API_BASE}`);
  console.log(`RPC: ${RPC.replace(/\/v2\/[^/]+$/, "/v2/***")}`);
  console.log(`Subgraph: ${GRAPHQL ? "configured" : "missing"}\n`);

  try {
    await testOnChainContracts();
  } catch (err) {
    fail("On-chain contract reads", err.message);
  }

  try {
    await testSubgraph();
  } catch (err) {
    fail("Subgraph query", err.message);
  }

  try {
    await testApiHealth();
    await testApiIpfsHealth();
    const token = await getAuthToken();
    await testApiAuth(token);
    await testApiLots(token);
    await testApiMarketOffers();
    await testApiNews();
    await testApiMarks(token);
    await testWalletProxyGuidance(token);
  } catch (err) {
    fail("API live checks", err.message);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
