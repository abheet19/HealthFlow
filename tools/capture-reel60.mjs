// capture-reel60.mjs — drives an isolated HealthFlow stack and records a smooth
// 60fps demo reel of the redesigned glass workspace.
//
// The showcase flow, driven through the exact controls a real user touches:
//
//   1. The clinic AccessGate — a synthetic clinic and user, plus the workspace
//      access code — then "Open workspace".
//   2. The IT dashboard: register a patient (a real server-generated ID) and
//      type the intake name so the glass intake form comes alive.
//   3. The ⌘K command palette: open it, filter to a department, jump.
//   4. A dense-vitals dashboard (General): height + weight auto-compute BMI,
//      then BP and pulse — the redesigned vitals surface in action.
//   5. ⌘K again to switch dashboards (General → Dental), ending on a hold.
//
// Playwright records the session as .webm; ffmpeg then interpolates it to a
// genuinely smooth 60fps H.264 MP4 (docs/media/healthflow-reel.mp4) and a
// smaller looping GIF for the README (docs/media/healthflow-demo.gif).
//
// Run:  node tools/capture-reel60.mjs
//       HEALTHFLOW_URL=... HEALTHFLOW_API_URL=... HEALTHFLOW_ACCESS_CODE=... node tools/capture-reel60.mjs
//       FFMPEG=/path/to/ffmpeg node tools/capture-reel60.mjs   (if ffmpeg is not on PATH)

import { chromium } from "playwright";
import { mkdirSync, statSync, rmSync, mkdtempSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync, execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const MEDIA = join(ROOT, "docs", "media");

const BASE = (process.env.HEALTHFLOW_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const API = (process.env.HEALTHFLOW_API_URL ?? "http://127.0.0.1:5000").replace(/\/$/, "");
const ACCESS_CODE = process.env.HEALTHFLOW_ACCESS_CODE ?? "synthetic-local-test";
const CLINIC_ID = process.env.HEALTHFLOW_CLINIC_ID ?? "demo";
const USER_ID = process.env.HEALTHFLOW_USER_ID ?? "demo-user";

const hosts = [new URL(BASE).hostname, new URL(API).hostname];
const isLoopback = hosts.every((host) => ["127.0.0.1", "localhost", "[::1]"].includes(host));
if (!isLoopback) {
  if (process.env.HEALTHFLOW_ALLOW_REMOTE_CAPTURE !== "1") {
    throw new Error("Remote capture is disabled by default. Use an isolated local stack, or explicitly set HEALTHFLOW_ALLOW_REMOTE_CAPTURE=1.");
  }
  if (!process.env.HEALTHFLOW_ACCESS_CODE) {
    throw new Error("Remote capture requires HEALTHFLOW_ACCESS_CODE; no deployed credential is stored in this script.");
  }
}

const VIEWPORT = { width: 1280, height: 800 };
const DSF = 2;
const MP4 = join(MEDIA, "healthflow-reel.mp4");
const GIF = join(MEDIA, "healthflow-demo.gif");

mkdirSync(MEDIA, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Find an ffmpeg binary. Prefers $FFMPEG, then PATH, then the winget install path. */
function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return "ffmpeg";
  } catch {
    /* not on PATH */
  }
  const winget =
    "C:/Users/abhee/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe";
  try {
    execSync(`"${winget}" -version`, { stdio: "ignore" });
    return winget;
  } catch {
    throw new Error("ffmpeg not found — set $FFMPEG to its full path.");
  }
}

/** Wait until both the app and its database-aware API health probe answer. */
async function wakeStack() {
  console.log(`Checking stack — ${BASE} / ${API}`);
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const [app, health] = await Promise.all([
        fetch(BASE, { signal: AbortSignal.timeout(30_000) }),
        fetch(`${API}/health`, { signal: AbortSignal.timeout(30_000) }),
      ]);
      const body = await health.json().catch(() => ({}));
      console.log(`  attempt ${attempt}: app ${app.status}, api ${health.status} (db ${body.database ?? "?"})`);
      if (app.ok && health.ok && body.status === "ok") return;
    } catch (err) {
      console.log(`  attempt ${attempt}: ${err.message}`);
    }
    await sleep(3000);
  }
  throw new Error("HealthFlow stack did not become healthy in time.");
}

/** Type into an <input> found by its field label, verifying and repairing the value. */
async function typeInto(page, label, text, { delay = 55 } = {}) {
  const field = page.getByLabel(label, { exact: true }).first();
  await field.scrollIntoViewIfNeeded();
  await field.click();
  await page.waitForTimeout(120);
  await field.pressSequentially(text, { delay });
  await page.waitForTimeout(500);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await field.inputValue()) === text) return;
    await field.fill(text);
    await page.waitForTimeout(400);
  }
}

/** Open the ⌘K palette, type a query, and Enter to jump. */
async function jumpVia(page, query) {
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder(/Jump to a department/i);
  await input.waitFor({ state: "visible", timeout: 8000 });
  await page.waitForTimeout(500);
  await input.pressSequentially(query, { delay: 90 });
  await page.waitForTimeout(700);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(900);
}

async function main() {
  const ffmpeg = findFfmpeg();
  console.log(`HealthFlow 60fps reel → ${BASE}  (ffmpeg: ${ffmpeg})`);

  await wakeStack();

  const tmp = mkdtempSync(join(tmpdir(), "healthflow-reel-"));
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DSF,
    colorScheme: "dark",
    acceptDownloads: false,
    recordVideo: { dir: tmp, size: VIEWPORT },
  });
  const t0 = Date.now();
  const page = await context.newPage();

  // ---- 1. The clinic AccessGate -------------------------------------------
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByLabel("Workspace access code").waitFor({ state: "visible", timeout: 30_000 });
  await sleep(1200); // hold on the glass login card

  // Clinic ID / User ID are pre-filled with the demo identity; set them anyway
  // so the reel is self-contained even if the defaults ever change.
  await page.getByLabel("Clinic ID").fill(CLINIC_ID);
  await page.getByLabel("User ID").fill(USER_ID);
  const codeField = page.getByLabel("Workspace access code");
  await codeField.click();
  await codeField.pressSequentially(ACCESS_CODE, { delay: 45 });
  await sleep(500);
  await page.getByRole("button", { name: /Open workspace/i }).click();

  // ---- 2. The IT dashboard: register a patient ----------------------------
  await page.getByRole("button", { name: /Register Patient/i }).waitFor({ state: "visible", timeout: 30_000 });
  await sleep(1000); // hold on the IT intake dashboard
  await page.getByRole("button", { name: /Register Patient/i }).click();
  // A server-generated patient ID lands and the intake form activates.
  await page.getByText(/Patient ID generated/i).first().waitFor({ timeout: 20_000 }).catch(() => {});
  await sleep(900);
  await typeInto(page, "Name", "Aarav Sharma", { delay: 70 });
  await typeInto(page, "DIV", "7-B", { delay: 60 });
  await typeInto(page, "Roll No", "18", { delay: 60 });
  await sleep(900);

  // ---- 3. The ⌘K command palette → a dense-vitals dashboard ---------------
  await jumpVia(page, "general");
  await page.getByText(/General Examination Report/i).first().waitFor({ timeout: 15_000 });
  await sleep(800);

  // ---- 4. Dense vitals: height + weight compute BMI, then BP + pulse -------
  await typeInto(page, "Height (cm)", "138", { delay: 60 });
  await typeInto(page, "Weight (kg)", "34", { delay: 60 });
  await sleep(700); // BMI + category chip fill themselves in
  await typeInto(page, "BP", "108/70", { delay: 45 });
  await typeInto(page, "Pulse", "84", { delay: 45 });
  await sleep(1100); // hold on the populated vitals surface

  // ---- 5. Switch dashboards via the palette (General → Dental) ------------
  await jumpVia(page, "dental");
  await page.getByText(/Dental Examination Report/i).first().waitFor({ timeout: 15_000 });
  await sleep(1600); // final hold

  const tEnd = Date.now();
  const video = page.video();
  await context.close(); // flushes the .webm
  await browser.close();
  const webm = await video.path();

  const total = ((tEnd - t0) / 1000).toFixed(1);
  console.log(`  captured webm ${webm} (~${total}s)`);

  // ---- 6. ffmpeg: smooth 60fps MP4 via motion interpolation ---------------
  // minterpolate synthesises intermediate frames so the 60fps output is
  // genuinely smooth rather than duplicated; -r 60 stamps the output rate.
  const mp4Filter =
    "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=1280:-2:flags=lanczos";
  const mp4Args = [
    "-y", "-i", webm,
    "-vf", mp4Filter,
    "-r", "60",
    "-c:v", "libx264", "-preset", "slow", "-crf", "23",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    MP4,
  ];
  console.log("  encoding 60fps MP4 (motion-interpolated)…");
  let r = spawnSync(ffmpeg, mp4Args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg (mp4) exited ${r.status}`);

  // ---- 7. A smaller looping GIF for the README ----------------------------
  const gifFilter =
    "fps=13,scale=680:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=160:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5";
  const gifArgs = ["-y", "-i", MP4, "-filter_complex", gifFilter, "-loop", "0", GIF];
  console.log("  encoding looping GIF…");
  r = spawnSync(ffmpeg, gifArgs, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg (gif) exited ${r.status}`);

  rmSync(tmp, { recursive: true, force: true });
  const mp4Mb = (statSync(MP4).size / 1024 / 1024).toFixed(2);
  const gifMb = (statSync(GIF).size / 1024 / 1024).toFixed(2);
  console.log(`  wrote ${MP4} (${mp4Mb} MB, 60fps)`);
  console.log(`  wrote ${GIF} (${gifMb} MB)`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("\nReel capture failed:", err);
  process.exit(1);
});
