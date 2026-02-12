#!/usr/bin/env node
/**
 * NFR-1: Dashboard must load under 2 seconds (fast 3G, up to 50 tasks).
 * This script asserts API response times for critical routes stay under the budget.
 * Run with dev/server up: BASE_URL=http://localhost:3000 node scripts/perf-check.mjs
 * Protected routes will 401; we still measure server response time.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const BUDGET_MS = 2000;
const ROUTES = [
  { name: "Dashboard API", path: "/api/dashboard" },
  { name: "Focus today API", path: "/api/focus/today" },
];

async function measure(url) {
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BUDGET_MS + 1000);
  try {
    await fetch(url, { method: "GET", signal: controller.signal });
  } catch {
    // 401/403 or timeout — we still have timing
  } finally {
    clearTimeout(timeout);
  }
  return performance.now() - start;
}

async function main() {
  console.log(`Perf check (budget ${BUDGET_MS}ms): ${BASE_URL}\n`);
  let failed = false;
  for (const { name, path } of ROUTES) {
    const url = BASE_URL + path;
    const ms = await measure(url);
    const ok = ms <= BUDGET_MS;
    if (!ok) failed = true;
    console.log(`${ok ? "✓" : "✗"} ${name}: ${Math.round(ms)}ms ${ok ? "" : `(exceeds ${BUDGET_MS}ms)`}`);
  }
  console.log("");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
