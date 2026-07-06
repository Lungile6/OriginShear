const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { of: hashToCid } = require("ipfs-only-hash");

const API_ROOT = path.resolve(__dirname, "../..");
const DEV_STORE_DIR = path.join(API_ROOT, "data", "ipfs-dev");

function resolveKeyPath(keyPath) {
  if (!keyPath) return null;
  if (path.isAbsolute(keyPath)) return keyPath;
  return path.resolve(API_ROOT, keyPath.replace(/^\.\//, ""));
}

function readPrivateKeyPem() {
  const inline = process.env.INFURA_JWT_PRIVATE_KEY;
  if (inline) {
    return inline.replace(/\\n/g, "\n");
  }

  const keyPath = resolveKeyPath(process.env.INFURA_JWT_PRIVATE_KEY_PATH);
  if (keyPath && fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, "utf8");
  }

  return null;
}

function getJwtAlgorithm(privateKeyPem) {
  if (/EC PRIVATE KEY/.test(privateKeyPem)) return "ES256";
  return "RS256";
}

function createInfuraJwt() {
  const keyId = process.env.INFURA_JWT_KEY_ID;
  const privateKeyPem = readPrivateKeyPem();

  if (!keyId || !privateKeyPem) {
    return null;
  }

  const algorithm = getJwtAlgorithm(privateKeyPem);
  return jwt.sign({}, privateKeyPem, {
    algorithm,
    keyid: keyId,
    audience: "infura.io",
    expiresIn: "1h",
    header: { typ: "JWT" },
  });
}

function getInfuraAuthHeaders() {
  const staticJwt = process.env.INFURA_IPFS_JWT || process.env.IPFS_JWT;
  if (staticJwt?.startsWith("eyJ")) {
    return { Authorization: `Bearer ${staticJwt}` };
  }

  const generated = createInfuraJwt();
  if (generated) {
    return { Authorization: `Bearer ${generated}` };
  }

  return {};
}

function isDevFallbackEnabled() {
  if (process.env.IPFS_DEV_FALLBACK === "false") return false;
  if (process.env.IPFS_DEV_FALLBACK === "true") return true;
  return process.env.NODE_ENV !== "production";
}

function isLocalIpfsUrl(apiBase) {
  try {
    const { hostname } = new URL(apiBase);
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

async function storeDevMetadata(metadata) {
  const json = JSON.stringify(metadata);
  const cid = await hashToCid(Buffer.from(json), { cidVersion: 1 });
  fs.mkdirSync(DEV_STORE_DIR, { recursive: true });
  fs.writeFileSync(path.join(DEV_STORE_DIR, `${cid}.json`), json, "utf8");
  console.warn(`[IPFS] Remote upload unavailable — stored metadata locally as ${cid}`);
  return { cid, devFallback: true };
}

async function uploadViaHttp(metadata, { apiBase, headers = {} }) {
  const url = `${apiBase.replace(/\/+$/, "")}/add?pin=true`;
  const body = new FormData();
  body.append("file", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "lot-metadata.json");

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`IPFS add failed (${response.status}): ${details}`);
  }

  const raw = await response.text();
  const parsedLine = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .find(Boolean);

  const cid = parsedLine?.Hash || parsedLine?.Cid?.["/"] || null;
  if (!cid) {
    throw new Error("IPFS add succeeded but no CID was returned");
  }
  return { cid, devFallback: false };
}

async function uploadViaPinata(metadata) {
  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    throw new Error("PINATA_JWT is not configured");
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: "originshear-lot-metadata.json" },
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Pinata pin failed (${response.status}): ${details}`);
  }

  const payload = await response.json();
  if (!payload.IpfsHash) {
    throw new Error("Pinata pin succeeded but no CID was returned");
  }
  return { cid: payload.IpfsHash, devFallback: false };
}

async function uploadMetadata(metadata) {
  const errors = [];

  if (process.env.PINATA_JWT) {
    try {
      return await uploadViaPinata(metadata);
    } catch (err) {
      errors.push(`Pinata: ${err.message}`);
    }
  }

  const apiBase = process.env.IPFS_API_URL || "https://ipfs.infura.io:5001/api/v0";
  const localIpfs = process.env.IPFS_PROVIDER === "local" || isLocalIpfsUrl(apiBase);

  try {
    const headers = localIpfs ? {} : getInfuraAuthHeaders();
    if (!localIpfs && !headers.Authorization) {
      throw new Error("Infura JWT not configured (INFURA_JWT_KEY_ID + private key path)");
    }
    return await uploadViaHttp(metadata, { apiBase, headers });
  } catch (err) {
    errors.push(`Remote IPFS: ${err.message}`);
  }

  if (isDevFallbackEnabled()) {
    return storeDevMetadata(metadata);
  }

  throw new Error(
    [
      "All IPFS upload methods failed.",
      ...errors,
      "Infura IPFS often requires separate product approval. For local dev, set IPFS_DEV_FALLBACK=true or run a local IPFS node at http://127.0.0.1:5001/api/v0.",
    ].join(" ")
  );
}

function readDevMetadata(cid) {
  const filePath = path.join(DEV_STORE_DIR, `${cid}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getIpfsConfigStatus() {
  const keyPath = resolveKeyPath(process.env.INFURA_JWT_PRIVATE_KEY_PATH);
  return {
    provider: process.env.PINATA_JWT
      ? "pinata"
      : process.env.IPFS_PROVIDER === "local"
        ? "local"
        : "infura",
    pinataConfigured: Boolean(process.env.PINATA_JWT),
    infuraJwtKeyId: Boolean(process.env.INFURA_JWT_KEY_ID),
    infuraPrivateKeyFound: Boolean(keyPath && fs.existsSync(keyPath)),
    devFallbackEnabled: isDevFallbackEnabled(),
    ipfsApiUrl: process.env.IPFS_API_URL || "https://ipfs.infura.io:5001/api/v0",
  };
}

function toIpfsUri(cid) {
  return `ipfs://${cid}`;
}

function toGatewayUrl(cid) {
  if (readDevMetadata(cid)) {
    const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    return `${base}/api/ipfs/metadata/${cid}`;
  }
  const gateway = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs";
  return `${gateway}/${cid}`;
}

module.exports = {
  uploadMetadata,
  readDevMetadata,
  getIpfsConfigStatus,
  toIpfsUri,
  toGatewayUrl,
  DEV_STORE_DIR,
};
