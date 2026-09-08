/**
 * HealthFlow hero-demo recorder.
 *
 * Drives an isolated local app with two independent browser contexts side by side
 * (IT desk on the left, a department dashboard on the right) and captures PNG
 * frame pairs of the real flow:
 *
 *   IT registers a patient  ->  the department tab picks the patient up live
 *   over the Socket.IO connection  ->  ENT / Vision / General / Dental each
 *   submit and light up IT's status tiles in real time  ->  IT's final submit
 *   writes the record to Postgres  ->  the Patients List shows it and hands
 *   back a generated .docx report.
 *
 * The two contexts do NOT share localStorage, so anything that appears in the
 * right-hand pane genuinely arrived over the WebSocket.
 *
 * Frames are written to tools/.frames/ along with a manifest; build-gif.py
 * composites the pairs and assembles the animated GIF.
 *
 * Usage:
 *   cd tools
 *   npm install
 *   npx playwright install chromium
 *   node record-demo.mjs                       # local stack only; remote hosts are rejected
 *   BASE_URL=http://localhost:5173 node record-demo.mjs   # or against a local dev server
 *
 * Then:
 *   python build-gif.py
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5179";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(BASE_URL).hostname)) throw new Error("Recording writes synthetic records: use a loopback-only isolated stack.");
const ACCESS_CODE = process.env.HEALTHFLOW_ACCESS_CODE || "synthetic-local-test";
const FRAME_DIR = path.join(HERE, ".frames");
const PHOTO = path.join(HERE, "assets", "demo-patient.jpg");

// Each pane is captured at 640x800 CSS pixels at 2x, giving a 1280x1600 PNG.
// Two panes composite to 2560x1600, which build-gif.py downsamples to ~1000px
// wide - a supersample, so the small MUI label text stays crisp in the GIF.
const PANE = { width: 640, height: 800 };
const SCALE = 2;

// The dashboards debounce every keystroke by 300ms, then broadcast the section
// over Socket.IO - and the server echoes that broadcast back to the sender,
// which re-hydrates the form from the record. Move to the next field before
// that round trip lands and the echo overwrites what you just typed. Pausing
// between fields is what a human does anyway, and it keeps the demo readable.
const SETTLE = 1200;

// Everything in these forms is a clinical yes/no, and a demo patient with a
// clean bill of health reads better than a randomly-picked one. For most
// fields "clean" means Absent/Normal/No; for the handful below, where the
// question is asked the other way round ("Conscious?", "Alert?"), it means Yes.
const PREFERRED = [
  "No Abnormality", "Normal", "Absent", "No", "Nil", "None",
  "6/6", "Yes", "Present",
];
const HEALTHY_YES = new Set([
  "Conscious", "Oriented", "Playful", "Active", "Alert",
  "Normal Hearing", "Bowel Sound",
]);

// The IT intake values, kept in one place so the pre-submit check can
// re-assert exactly what was typed.
const IT_FIELDS = [
  ["Name", "Demo Patient"],
  ["DIV", "A"],
  ["Roll No", "42"],
  ["Admin No", "HF-2026-042"],
  ["Father's Name", "Test Record"],
  ["Mother's Name", "Test Record"],
  ["Mobile", "9000000000"],
  ["DOB", "2012-04-18"],
  ["Medical Officer", "Dr. A. Rao"],
];

const frames = [];
let frameNo = 0;
let itPage, deptPage;

/** Capture one frame pair. `hold` is in 1/8th-second ticks. */
async function shot(hold = 1) {
  frameNo += 1;
  const id = String(frameNo).padStart(4, "0");
  const [left, right] = await Promise.all([
    itPage.screenshot({ type: "png" }),
    deptPage.screenshot({ type: "png" }),
  ]);
  fs.writeFileSync(path.join(FRAME_DIR, `${id}-L.png`), left);
  fs.writeFileSync(path.join(FRAME_DIR, `${id}-R.png`), right);
  frames.push({ l: `${id}-L.png`, r: `${id}-R.png`, hold });
  process.stdout.write(`\r  frame ${id} (hold ${hold})   `);
}

/** Shoot `count` frames spaced `gapMs` apart - used to catch a live transition. */
async function burst(count, gapMs = 90, hold = 1) {
  for (let i = 0; i < count; i += 1) {
    await shot(hold);
    if (i < count - 1) await itPage.waitForTimeout(gapMs);
  }
}

const labelled = (page, label) =>
  page.locator(".MuiFormControl-root").filter({
    has: page.locator(`label:text-is(${JSON.stringify(label)})`),
  });

/**
 * Type into a MUI TextField at a human-readable speed, filming as it goes.
 *
 * These are controlled React inputs behind a 300ms debounce, and clicking one
 * then immediately sending keys drops the first keystroke often enough to
 * matter - so focus explicitly, type, then verify and repair the value.
 */
async function typeInto(page, label, text, { delay = 55, shotEvery = 0 } = {}) {
  const field = labelled(page, label).locator("input, textarea").first();
  await field.scrollIntoViewIfNeeded();
  await field.click();
  await field.focus();
  await page.waitForTimeout(120);
  for (let i = 0; i < text.length; i += 1) {
    await field.pressSequentially(text[i], { delay });
    if (shotEvery && (i + 1) % shotEvery === 0) await shot(1);
  }
  await page.waitForTimeout(SETTLE);
  // Repair a dropped first keystroke, or a value an echo stomped on.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await field.inputValue()) === text) return;
    await field.fill(text);
    await page.waitForTimeout(SETTLE);
  }
  throw new Error(`Could not get "${text}" to stick in the ${label} field`);
}

async function setDate(page, label, value) {
  const field = labelled(page, label).locator("input").first();
  await field.fill(value);
  await page.waitForTimeout(SETTLE);
}

/** Open the nth MUI Select on the page and pick an option. */
async function pickNth(page, index, wanted = null) {
  const combo = page.locator('[role="combobox"]').nth(index);
  await combo.scrollIntoViewIfNeeded();
  // The field's own label decides what "healthy" means for this question.
  const fieldLabel = (
    await combo.locator("xpath=ancestor::*[contains(@class,'MuiFormControl-root')][1]//label")
      .first().innerText().catch(() => "")
  ).trim();
  await combo.click();
  const listbox = page.locator('ul[role="listbox"]').last();
  await listbox.waitFor({ state: "visible" });
  const options = await listbox.locator('li[role="option"]').allInnerTexts();
  const order = wanted
    ? [wanted, ...PREFERRED]
    : HEALTHY_YES.has(fieldLabel)
      ? ["Yes", "Normal", ...PREFERRED]
      : PREFERRED;
  const choice = order.find((v) => options.includes(v)) ?? options[0];
  await listbox.locator(`li[role="option"]:text-is(${JSON.stringify(choice)})`).first().click();
  await page.waitForTimeout(60);
  return choice;
}

/** Fill every Select on the page, filming every `shotEvery` fields. */
async function fillAllSelects(page, { shotEvery = 0, overrides = {} } = {}) {
  const total = await page.locator('[role="combobox"]').count();
  for (let i = 0; i < total; i += 1) {
    await pickNth(page, i, overrides[i]);
    if (shotEvery && (i + 1) % shotEvery === 0) await shot(1);
  }
  return total;
}

const clickText = (page, text) =>
  page.locator(`button:has-text(${JSON.stringify(text)})`).first().click();

/**
 * Click a department's Save and insist on the success toast. A silent
 * validation failure here would produce a GIF that quietly shows a department
 * never completing, so fail loudly instead.
 */
async function saveDept(page, name) {
  await clickText(page, "Save");
  try {
    await page.getByText(/saved successfully/i).first().waitFor({ timeout: 10000 });
  } catch {
    const err = await page.getByText(/Please .*required/i).first()
      .innerText().catch(() => "(no toast found)");
    throw new Error(`${name} did not save: ${err}`);
  }
}

/**
 * Wait until the IT dashboard shows `n` departments marked complete. This is
 * the real-time assertion: nothing on the IT tab submitted these, the state
 * arrived from the other tab over the socket.
 */
async function waitForTiles(n, timeout = 20000) {
  await itPage.waitForFunction(
    (want) => (document.body.innerText.match(/Completed/g) || []).length >= want,
    n,
    { timeout }
  );
}

/** Wait until a department pane reflects something IT did, over the socket. */
async function waitForLive(page, textOrRe, timeout = 20000) {
  await page.getByText(textOrRe).first().waitFor({ state: "visible", timeout });
}

async function main() {
  fs.rmSync(FRAME_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAME_DIR, { recursive: true });

  console.log(`Recording against ${BASE_URL}`);
  // Fly scale-to-zero: wake both machines before the camera rolls, so the
  // recording never opens on a cold start.
  console.log("Checking isolated local stack...");
  for (const url of [BASE_URL, `${process.env.API_URL || "http://127.0.0.1:5059"}/health`]) {
    try {
      const t0 = Date.now();
      const r = await fetch(url);
      console.log(`  ${url} -> ${r.status} in ${Date.now() - t0}ms`);
    } catch (e) {
      console.log(`  ${url} -> ${e.message}`);
    }
  }

  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  // Two separate contexts => two separate localStorage jars. Nothing crosses
  // between the panes except over the real Socket.IO connection.
  const ctxIT = await browser.newContext({ viewport: PANE, deviceScaleFactor: SCALE });
  const ctxDept = await browser.newContext({
    viewport: PANE, deviceScaleFactor: SCALE, acceptDownloads: true,
  });
  itPage = await ctxIT.newPage();
  deptPage = await ctxDept.newPage();

  await itPage.goto(`${BASE_URL}/it`, { waitUntil: "networkidle" });
  await deptPage.goto(`${BASE_URL}/ent`, { waitUntil: "networkidle" });
  for (const page of [itPage, deptPage]) {
    await page.getByLabel("Workspace access code").fill(ACCESS_CODE);
    await page.getByRole("button", { name: "Open workspace" }).click();
    await page.getByLabel("Workspace access code").waitFor({ state: "detached" });
  }

  // Let both sockets finish connecting so the ENT pane shows its real
  // "waiting for a patient ID" state rather than the connecting spinner.
  await waitForLive(deptPage, /Waiting for patient ID/i);
  await itPage.waitForTimeout(500);

  // --- 1. Opening still: IT intake on the left, ENT waiting on the right ----
  await shot(14);

  // --- 2. THE MONEY SHOT: register, and watch ENT pick it up live ----------
  await clickText(itPage, "Register Patient");
  await burst(7, 110, 1);
  await waitForLive(deptPage, /ENT Examination Report/i);
  await burst(4, 140, 1);
  await itPage.waitForTimeout(600);
  await shot(22);   // hold on both panes showing the same Patient ID

  const patientId = (await itPage.locator("span.font-mono").first().innerText()).trim();
  console.log(`\n  Patient ID: ${patientId}`);
  fs.writeFileSync(path.join(FRAME_DIR, "patient-id.txt"), patientId);

  // --- 3. IT fills the intake form; the name lands in ENT's header live ----
  await typeInto(itPage, "Name", "Demo Patient", { delay: 75, shotEvery: 2 });
  await itPage.waitForTimeout(1100);
  await shot(3);
  await waitForLive(deptPage, /Demo Patient/);
  await shot(16);   // ENT now shows "Patient Name: Demo Patient"

  await typeInto(itPage, "DIV", "A", { delay: 60 });
  await typeInto(itPage, "Roll No", "42", { delay: 60 });
  await shot(2);
  await typeInto(itPage, "Admin No", "HF-2026-042", { delay: 35 });
  await shot(2);
  await typeInto(itPage, "Father's Name", "Test Record", { delay: 30 });
  await typeInto(itPage, "Mother's Name", "Test Record", { delay: 30 });
  await shot(2);
  await typeInto(itPage, "Mobile", "9000000000", { delay: 30 });
  await setDate(itPage, "DOB", "2012-04-18");
  await itPage.waitForTimeout(SETTLE);
  await shot(3);

  await pickNth(itPage, 0, "Female");        // Gender
  await itPage.waitForTimeout(SETTLE);
  await pickNth(itPage, 1, "O+");            // Blood Group
  await itPage.waitForTimeout(SETTLE);
  await shot(3);
  await typeInto(itPage, "Medical Officer", "Dr. A. Rao", { delay: 45 });
  await shot(4);

  // Photo last: it broadcasts the whole IT section, so let the individual
  // field updates settle first.
  await itPage.locator("#patient-photo-upload").setInputFiles(PHOTO);
  await itPage.waitForTimeout(2500);
  await shot(10);

  // --- 4. ENT submits; IT's status tile flips to Completed, live -----------
  await fillAllSelects(deptPage, { shotEvery: 6 });
  await shot(4);
  await saveDept(deptPage, "ENT");
  await burst(5, 130, 1);
  await waitForTiles(1);
  await itPage.waitForTimeout(500);
  await shot(16);

  // --- 5. The other three departments, same live path ----------------------
  // Vision: two vision fields are pre-set to 6/6, the rest are dropdowns.
  await deptPage.goto(`${BASE_URL}/vision`, { waitUntil: "networkidle" });
  await deptPage.waitForTimeout(700);
  await shot(6);
  await fillAllSelects(deptPage, { shotEvery: 3 });
  await saveDept(deptPage, "Vision");
  await waitForTiles(2);
  await deptPage.waitForTimeout(700);
  await shot(12);

  // General: BMI is computed from height + weight, the rest are typed vitals.
  await deptPage.goto(`${BASE_URL}/general`, { waitUntil: "networkidle" });
  await deptPage.waitForTimeout(700);
  await typeInto(deptPage, "Height (cm)", "142", { delay: 45 });
  await typeInto(deptPage, "Weight (kg)", "36", { delay: 45 });
  await deptPage.waitForTimeout(400);
  await shot(8);   // BMI fills itself in
  await typeInto(deptPage, "BP", "104/68", { delay: 30 });
  await typeInto(deptPage, "Pulse", "82", { delay: 30 });
  await typeInto(deptPage, "Hip", "70", { delay: 30 });
  await typeInto(deptPage, "Waist", "62", { delay: 30 });
  await shot(4);
  await fillAllSelects(deptPage, { shotEvery: 8 });
  await saveDept(deptPage, "General");
  await waitForTiles(3);
  await deptPage.waitForTimeout(700);
  await shot(12);

  // Dental.
  await deptPage.goto(`${BASE_URL}/dental`, { waitUntil: "networkidle" });
  await deptPage.waitForTimeout(700);
  await shot(6);
  await fillAllSelects(deptPage, { shotEvery: 6 });
  await saveDept(deptPage, "Dental");
  await burst(4, 140, 1);
  await waitForTiles(4);
  await itPage.waitForTimeout(700);
  await itPage.evaluate(() => window.scrollTo({ top: 0 }));
  await shot(20);   // all four department tiles now green on the IT dashboard

  // --- 6. IT's final submit writes the record to Postgres ------------------
  // Assert every IT field before submitting; never repair the application under test. If a late socket echo
  // cleared one, the submit would fail validation and the GIF would end on a
  // red toast - repair it here rather than record a broken flow.
  for (const [label, value] of IT_FIELDS) {
    const field = labelled(itPage, label).locator("input").first();
    if ((await field.inputValue()) !== value) throw new Error(`Intake lost field ${label}`);
  }
  await shot(2);
  await clickText(itPage, "Submit");
  await burst(5, 150, 1);
  await waitForLive(itPage, /submitted successfully/i, 30000);
  await shot(20);

  // --- 7. The record in the Patients List, and the generated .docx ---------
  await deptPage.goto(`${BASE_URL}/patients`, { waitUntil: "networkidle" });
  await deptPage.getByText("Demo Patient").first().waitFor({ timeout: 20000 });
  await deptPage.waitForTimeout(600);
  await shot(20);

  const dl = deptPage.waitForEvent("download", { timeout: 40000 });
  await deptPage.locator('button:has-text("Word Doc")').first().click();
  const download = await dl;
  const out = path.join(FRAME_DIR, "Demo Patient's Report.docx");
  await download.saveAs(out);
  console.log(`\n  Report downloaded: ${out} (${fs.statSync(out).size} bytes)`);
  await deptPage.waitForTimeout(500);
  await shot(24);   // "DOCX report downloaded successfully"

  fs.writeFileSync(
    path.join(FRAME_DIR, "manifest.json"),
    JSON.stringify({ base: BASE_URL, patientId, pane: PANE, scale: SCALE, frames }, null, 2)
  );
  console.log(`\nCaptured ${frames.length} unique frames -> ${FRAME_DIR}`);
  console.log(`Patient ID written to isolated local database: ${patientId}`);

  await browser.close();
}

main().catch(async (e) => {
  console.error("\nRecording failed:", e);
  process.exit(1);
});
