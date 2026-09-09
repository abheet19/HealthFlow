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

try {
  await page.goto(`${base}/not-a-healthflow-route`, { waitUntil: "networkidle" });
  await unlock();
  await page.getByRole("heading", { name: "Page not found" }).waitFor();
  await page.getByRole("link", { name: "Return to IT" }).click();
  await page.getByRole("heading", { name: "IT Dashboard" }).waitFor();
  checks.push("unknown route explains the problem and returns to IT");

  const routes = [
    ["ENT", "/ent"],
    ["Vision", "/vision"],
    ["General", "/general"],
    ["Dental", "/dental"],
    ["Patients List", "/patients"],
    ["IT", "/it"],
  ];
  for (const [label, path] of routes) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await page.waitForURL(url => url.pathname === path);
    if (["/ent", "/vision", "/general", "/dental"].includes(path)) {
      await page.getByText(/Waiting for patient ID/i).waitFor();
    } else {
      await page.getByRole("heading", {
        name: path === "/patients" ? "Patients List" : "IT Dashboard",
      }).waitFor();
    }
    checks.push(`${label} navigation opens ${path}`);
  }

  await page.goto(`${base}/patients`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "HealthFlow home" }).click();
  await page.getByRole("heading", { name: "IT Dashboard" }).waitFor();
  checks.push("brand link returns to IT");

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks: checks.length, errors }));
} finally {
  await browser.close();
}
