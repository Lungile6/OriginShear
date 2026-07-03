const DEFAULT_GATEWAY = "https://ipfs.io/ipfs";

export function toGatewayUrl(uriOrCid) {
  if (!uriOrCid) return "";

  const raw = String(uriOrCid).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const gateway = (import.meta.env.VITE_IPFS_GATEWAY || DEFAULT_GATEWAY).replace(/\/+$/, "");
  const cid = raw.startsWith("ipfs://") ? raw.slice("ipfs://".length) : raw;
  return `${gateway}/${cid}`;
}
