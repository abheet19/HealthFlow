import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { browserLaunchOptions } from "./browser-options.mjs";

const frontend = process.env.PUBLIC_FRONTEND_URL || "https://healthflow-abheet19.fly.dev";
const backend = process.env.PUBLIC_BACKEND_URL || "https://healthflow-api-abheet19.fly.dev";
const expectedRevision = process.env.EXPECTED_REVISION;
const evidence = process.env.VERIFICATION_DIR
  || fileURLToPath(new URL("../docs/verification/", import.meta.url));
await mkdir(evidence, { recursive: true });

const browser = await chromium.launch(browserLaunchOptions());
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const httpFailures = [];
const checks = [];

await page.addInitScript(() => {
  window.__healthflowLayoutShift = 0;
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__healthflowLayoutShift += entry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
});
page.on("pageerror", error => errors.push(`page: ${error.message}`));
page.on("console", message => {
  if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
    errors.push(`console: ${message.text()}`);
  }
});
page.on("response", response => {
  if (response.status() >= 400) httpFailures.push({ status: response.status(), url: response.url() });
});

try {
  const response = await page.goto(frontend, { waitUntil: "networkidle", timeout: 45_000 });
  assert.equal(response?.status(), 200);
  await page.getByRole("heading", { name: "HealthFlow", exact: true }).waitFor();
  await page.getByLabel("Workspace access code").waitFor();
  checks.push("public frontend serves the access gate");

  const frontendReleaseResponse = await page.request.get(`${frontend}/release.json`);
  assert.equal(frontendReleaseResponse.status(), 200);
  const frontendRelease = await frontendReleaseResponse.json();
  assert.match(frontendRelease.release, /^[0-9a-f]{40}$/);
  checks.push("frontend exposes an immutable Git release identity");

  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.getByText("Enter the clinic ID, user ID, and workspace access code.").waitFor();
  checks.push("empty workspace credentials are rejected in the browser");

  await page.getByLabel("Clinic ID").fill("demo");
  await page.getByLabel("User ID").fill("demo-user");
  await page.getByLabel("Workspace access code").fill("definitely-not-the-code");
  await page.route(`${backend}/api/session`, async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Open workspace" }).click();
  const pendingButton = page.getByRole("button", { name: "Checking code…" });
  await pendingButton.waitFor();
  assert.equal(await pendingButton.isDisabled(), true);
  await page.getByText("The workspace is unavailable. Try again shortly.").waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.length), 0);
  checks.push("transport failure shows a bounded loading state and safe retry message");

  await page.unroute(`${backend}/api/session`);
  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.getByText("That workspace code is not valid.").waitFor({ timeout: 20_000 });
  assert.equal(await page.evaluate(() => sessionStorage.length), 0);
  checks.push("access recovers after transport failure and the backend rejects an invalid secret");

  const health = await page.request.get(`${backend}/health`, { timeout: 20_000 });
  assert.equal(health.status(), 200);
  const healthBody = await health.json();
  assert.equal(healthBody.status, "ok");
  assert.equal(healthBody.database, "ok");
  assert.match(healthBody.release, /^[0-9a-f]{40}$/);
  assert.equal(healthBody.release, frontendRelease.release);
  if (expectedRevision) assert.equal(healthBody.release, expectedRevision);
  assert.ok(health.headers()["x-request-id"]);
  assert.match(health.headers()["server-timing"] || "", /^app;dur=/);
  checks.push("frontend and database-aware API expose the same expected Git revision");

  const loadSamples = await Promise.all(Array.from({ length: 12 }, async () => {
    const startedAt = performance.now();
    const sample = await page.request.get(`${backend}/health`, { timeout: 20_000 });
    assert.equal(sample.status(), 200);
    return performance.now() - startedAt;
  }));
  const sortedSamples = [...loadSamples].sort((a, b) => a - b);
  const healthP95Ms = sortedSamples[Math.ceil(sortedSamples.length * 0.95) - 1];
  assert.ok(healthP95Ms < 5_000, `health p95 ${healthP95Ms.toFixed(1)}ms exceeded 5000ms`);
  checks.push("12-request bounded health probe stays below the 5s p95 release budget");

  await page.screenshot({ path: `${evidence}/public-access-gate.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Workspace access code").waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  );
  const undersizedTargets = await page.locator("button, input").evaluateAll(elements => elements
    .filter(element => {
      const style = getComputedStyle(element);
      return style.visibility !== "hidden" && style.display !== "none";
    })
    .map(element => {
      const box = element.getBoundingClientRect();
      return { name: element.getAttribute("aria-label") || element.textContent || element.id, width: box.width, height: box.height };
    })
    .filter(target => target.width < 24 || target.height < 24));
  assert.deepEqual(undersizedTargets, []);
  await page.screenshot({ path: `${evidence}/public-access-gate-320.png`, fullPage: true });
  checks.push("320px access gate has no page overflow and all controls meet the 24px target floor");

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByName("first-contentful-paint")[0];
    return {
      cumulativeLayoutShift: Number(window.__healthflowLayoutShift.toFixed(4)),
      domContentLoadedMs: Number(navigation.domContentLoadedEventEnd.toFixed(1)),
      firstContentfulPaintMs: paint ? Number(paint.startTime.toFixed(1)) : null,
    };
  });
  assert.ok(metrics.cumulativeLayoutShift <= 0.1, `CLS ${metrics.cumulativeLayoutShift} exceeded 0.1`);

  const unexpectedHttpFailures = httpFailures.filter(
    failure => failure.status !== 401 || !failure.url.endsWith("/api/session"),
  );
  assert.deepEqual(unexpectedHttpFailures, []);
  assert.deepEqual(errors, []);
  const result = {
    at: new Date().toISOString(),
    environment: "deployed Fly frontend and backend; unauthenticated boundary only",
    release: healthBody.release,
    checks,
    metrics: {
      ...metrics,
      concurrentHealthRequests: loadSamples.length,
      healthP95Ms: Number(healthP95Ms.toFixed(1)),
    },
    expectedHttpFailures: httpFailures.filter(failure => failure.status === 401),
    errors,
  };
  await writeFile(`${evidence}/public-smoke-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ checks: checks.length, release: healthBody.release, metrics: result.metrics, errors }));
} finally {
  await browser.close();
}
