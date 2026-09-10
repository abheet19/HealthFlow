import assert from "node:assert/strict";
import { chromium } from "playwright";
import { browserLaunchOptions } from "./browser-options.mjs";

const base = process.env.BASE_URL || "http://127.0.0.1:5179";
const browser = await chromium.launch(browserLaunchOptions());
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const checks = [];

page.on("pageerror", error => errors.push(error.message));

async function unlock() {
  await page.getByLabel("Workspace access code").fill("synthetic-local-test");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.getByLabel("Workspace access code").waitFor({ state: "detached" });
}

const routes = [
  ["ENT", "/ent"],
  ["Vision", "/vision"],
  ["General", "/general"],
  ["Dental", "/dental"],
  ["Patients List", "/patients"],
  ["IT", "/it"],
];

async function expectRoute(path) {
  await page.waitForURL(url => url.pathname === path);
  if (["/ent", "/vision", "/general", "/dental"].includes(path)) {
    await page.getByText(/Waiting for patient ID/i).waitFor();
    return;
  }
  await page.getByRole("heading", {
    name: path === "/patients" ? "Patients List" : "IT Dashboard",
  }).waitFor();
}

try {
  await page.goto(`${base}/not-a-healthflow-route`, { waitUntil: "networkidle" });
  await unlock();
  await page.getByRole("heading", { name: "Page not found" }).waitFor();
  await page.getByRole("link", { name: "Return to IT" }).click();
  await expectRoute("/it");
  checks.push("unknown route Return to IT action recovers to intake");

  await page.goto(`${base}/not-a-healthflow-route`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "View patients" }).click();
  await expectRoute("/patients");
  checks.push("unknown route View patients action recovers to the list");

  for (const [label, path] of routes) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expectRoute(path);
    checks.push(`${label} desktop navigation opens ${path}`);
  }

  await page.goto(`${base}/patients`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "HealthFlow home" }).click();
  await expectRoute("/it");
  checks.push("brand link returns to IT");

  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(`${base}/it`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await skipLink.waitFor();
  assert.equal(await skipLink.evaluate(node => node === document.activeElement), true);
  await skipLink.press("Enter");
  assert.equal(await page.locator("main").evaluate(node => node === document.activeElement), true);
  checks.push("keyboard focus starts at the skip link and its action focuses main content");

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.keyboard.press("Escape");
  await page.locator(".MuiDrawer-root").waitFor({ state: "detached" });
  checks.push("mobile navigation closes with Escape");

  for (const [label, path] of routes) {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("link", { name: label, exact: true }).last().click();
    await page.locator(".MuiDrawer-root").waitFor({ state: "detached" });
    await expectRoute(path);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
      `${path} overflowed a 320px viewport`,
    );
    assert.equal(await page.locator("main").count(), 1, `${path} must expose one main landmark`);
    checks.push(`${label} mobile navigation opens ${path} at 320px without page overflow`);
  }

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks: checks.length, errors }));
} finally {
  await browser.close();
}
