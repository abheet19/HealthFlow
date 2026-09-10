import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { browserLaunchOptions } from "./browser-options.mjs";

const base = process.env.BASE_URL || "http://127.0.0.1:5179";
const out = process.env.VERIFICATION_DIR
  || fileURLToPath(new URL("../docs/verification/", import.meta.url));
await mkdir(out, { recursive: true });

const browser = await chromium.launch(browserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
const checks = [];
page.on("pageerror", error => errors.push(error.message));

async function waitForCallback(getCallback, timeoutMs = 5_000) {
  const startedAt = Date.now();
  while (!getCallback()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error("Timed out waiting for intercepted request");
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByLabel("Clinic ID").fill("demo");
  await page.getByLabel("User ID").fill("demo-user");
  await page.getByLabel("Workspace access code").fill("synthetic-local-test");

  await page.route("**/api/session", async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Open workspace" }).click();
  const pendingButton = page.getByRole("button", { name: "Checking code…" });
  await pendingButton.waitFor();
  assert.equal(await pendingButton.isDisabled(), true);
  await page.getByText("The workspace is unavailable. Try again shortly.").waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem("healthflow-access-code")), null);
  checks.push("access loading and network-error states are safe and bounded");

  await page.unroute("**/api/session");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.getByLabel("Workspace access code").waitFor({ state: "detached" });
  checks.push("access retry recovers without reloading the page");

  let releasePatientsRequest;
  await page.route("**/api/patients", async route => {
    await new Promise(resolve => { releasePatientsRequest = resolve; });
    await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"synthetic outage"}' });
  });
  await page.goto(`${base}/patients`, { waitUntil: "domcontentloaded" });
  await page.locator(".MuiSkeleton-root").first().waitFor();
  await waitForCallback(() => releasePatientsRequest);
  releasePatientsRequest();
  await page.getByText(/Error fetching patients:/).waitFor();
  checks.push("patient list exposes loading and safe failure feedback");

  await page.unroute("**/api/patients");
  await page.getByRole("button", { name: "Refresh" }).click();
  await page.getByText("Demo Patient", { exact: true }).first().waitFor();
  await page.getByText("Patients list refreshed successfully").waitFor();
  checks.push("patient list recovers through its Refresh action");

  await page.route("**/api/generate_report?**", route => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: '{"error":"synthetic outage"}',
  }));
  const downloadButton = page.getByRole("button", { name: "Download Word document for Demo Patient" }).first();
  await downloadButton.click();
  await page.getByText("Failed to download DOCX report").waitFor();
  await page.unroute("**/api/generate_report?**");
  const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
  const stream = await download.createReadStream();
  let downloadedBytes = 0;
  for await (const chunk of stream) downloadedBytes += chunk.length;
  assert.ok(downloadedBytes > 50_000, `DOCX download was only ${downloadedBytes} bytes`);
  checks.push("report download reports failure, then recovers with a non-empty DOCX");

  await page.goto(`${base}/ent`, { waitUntil: "networkidle" });
  await page.getByText(/Waiting for patient ID/i).waitFor();
  await context.setOffline(true);
  await page.getByRole("heading", { name: /Connecting to HealthFlow|Connection lost/ }).waitFor({ timeout: 10_000 });
  await context.setOffline(false);
  await page.getByText(/Waiting for patient ID/i).waitFor({ timeout: 20_000 });
  checks.push("realtime client exposes disconnect state and reconnects automatically");

  await page.goto(`${base}/it`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Register Patient" }).click();
  await page.getByRole("button", { name: "Reset All Data" }).waitFor();
  await page.setViewportSize({ width: 320, height: 720 });

  for (const path of ["/it", "/ent", "/vision", "/general", "/dental", "/patients"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("main").count(), 1, `${path} must expose one main landmark`);
    assert.equal(await page.locator("h1").count(), 1, `${path} must expose one page heading`);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
      `${path} overflowed a 320px viewport`,
    );
    const contract = await page.locator("button, a[href], input:not([type=hidden]), [role=combobox]").evaluateAll(elements => {
      const visible = elements.filter(element => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return element.getAttribute("aria-hidden") !== "true"
          && style.display !== "none"
          && style.visibility !== "hidden"
          && box.width > 0
          && box.height > 0;
      });
      const accessibleName = element => {
        const labelledBy = element.getAttribute("aria-labelledby");
        const labelledText = labelledBy
          ? labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || "").join(" ")
          : "";
        const inputLabels = "labels" in element
          ? [...element.labels].map(label => label.textContent || "").join(" ")
          : "";
        return element.getAttribute("aria-label")
          || labelledText
          || inputLabels
          || element.getAttribute("title")
          || element.textContent
          || "";
      };
      const unnamed = visible
        .filter(element => !accessibleName(element).trim())
        .map(element => element.outerHTML.slice(0, 160));
      const undersized = visible
        .filter(element => !element.classList.contains("sr-only"))
        .map(element => {
          const box = element.getBoundingClientRect();
          return { name: accessibleName(element).trim(), width: box.width, height: box.height };
        })
        .filter(target => target.width < 24 || target.height < 24);
      return { unnamed, undersized };
    });
    assert.deepEqual(contract.unnamed, [], `${path} has unnamed controls`);
    assert.deepEqual(contract.undersized, [], `${path} has controls below 24px`);
    checks.push(`${path} passes the 320px landmark, accessible-name, target-size, and overflow contract`);
  }

  await page.goto(`${base}/it`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Reset All Data" }).click();
  await page.screenshot({ path: `${out}/resilience-320.png`, fullPage: true });

  assert.deepEqual(errors, []);
  const result = {
    at: new Date().toISOString(),
    environment: "isolated local PostgreSQL/Flask/React with intercepted failures",
    checks,
    downloadedBytes,
    errors,
  };
  await writeFile(`${out}/resilience-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ checks: checks.length, downloadedBytes, errors }));
} finally {
  await context.setOffline(false).catch(() => {});
  await browser.close();
}
