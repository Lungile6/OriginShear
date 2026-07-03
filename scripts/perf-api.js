#!/usr/bin/env node

const os = require("os");
const fs = require("fs");
const path = require("path");

function nowMs() {
  return Number(process.hrtime.bigint()) / 1e6;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(2));
}

async function hit(baseUrl, endpoint) {
  const start = nowMs();
  const res = await fetch(`${baseUrl}${endpoint}`);
  const end = nowMs();
  return {
    status: res.status,
    durationMs: end - start,
  };
}

async function runScenario({ baseUrl, endpoint, requests, concurrency }) {
  const durations = [];
  const statuses = {};
  let cursor = 0;

  async function worker() {
    while (cursor < requests) {
      const next = cursor;
      cursor += 1;
      if (next >= requests) break;

      try {
        const result = await hit(baseUrl, endpoint);
        durations.push(result.durationMs);
        statuses[result.status] = (statuses[result.status] || 0) + 1;
      } catch (error) {
        statuses.NETWORK_ERROR = (statuses.NETWORK_ERROR || 0) + 1;
      }
    }
  }

  const start = nowMs();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const end = nowMs();
  const elapsedMs = end - start;
  const throughput = requests / (elapsedMs / 1000);
  const avg =
    durations.length > 0
      ? Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2))
      : null;

  return {
    endpoint,
    requests,
    concurrency,
    elapsedMs: Number(elapsedMs.toFixed(2)),
    throughputRps: Number(throughput.toFixed(2)),
    latencyMs: {
      min: durations.length ? Number(Math.min(...durations).toFixed(2)) : null,
      avg,
      p95: percentile(durations, 95),
      max: durations.length ? Number(Math.max(...durations).toFixed(2)) : null,
    },
    statuses,
  };
}

async function main() {
  const baseUrl = process.env.PERF_BASE_URL || "http://localhost:3000";
  const requests = Number(process.env.PERF_REQUESTS || 120);
  const concurrency = Number(process.env.PERF_CONCURRENCY || 12);
  const endpoints = (process.env.PERF_ENDPOINTS || "/health")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  for (const endpoint of endpoints) {
    results.push(
      await runScenario({
        baseUrl,
        endpoint,
        requests,
        concurrency,
      })
    );
  }

  const cpuList = os.cpus();
  const cpuCores =
    typeof os.availableParallelism === "function"
      ? os.availableParallelism()
      : Array.isArray(cpuList) && cpuList.length > 0
        ? cpuList.length
        : 1;

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    node: process.version,
    platform: `${os.platform()} ${os.release()}`,
    cpuModel: cpuList[0]?.model || "unavailable-in-runtime",
    cpuCores,
    totalMemoryGB: Number((os.totalmem() / 1024 / 1024 / 1024).toFixed(2)),
    config: {
      requestsPerEndpoint: requests,
      concurrency,
      endpoints,
    },
    results,
  };

  const outputDir = path.join(process.cwd(), "evidence", "performance");
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `perf-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nSaved report: ${filePath}`);
}

main().catch((error) => {
  console.error("Performance run failed:", error);
  process.exit(1);
});
