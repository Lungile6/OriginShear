function getAuthHeaders() {
  const projectId = process.env.INFURA_PROJECT_ID;
  const projectSecret = process.env.INFURA_PROJECT_SECRET;
  if (!projectId || !projectSecret) return {};
  return {
    Authorization: `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString("base64")}`,
  };
}

async function uploadMetadata(metadata) {
  const apiBase = (process.env.IPFS_API_URL || "https://ipfs.infura.io:5001/api/v0").replace(/\/+$/, "");
  const url = `${apiBase}/add?pin=true`;
  const body = new FormData();
  body.append("file", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "lot-metadata.json");

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
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
  return cid;
}

function toIpfsUri(cid) {
  return `ipfs://${cid}`;
}

function toGatewayUrl(cid) {
  const gateway = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs";
  return `${gateway}/${cid}`;
}

module.exports = {
  uploadMetadata,
  toIpfsUri,
  toGatewayUrl,
};
