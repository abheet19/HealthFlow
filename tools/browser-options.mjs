/**
 * Use an explicit browser when requested, local Chrome on Windows, and the
 * Playwright-managed Chromium binary in Linux CI.
 */
export function browserLaunchOptions() {
  if (process.env.CHROME_PATH) {
    return { executablePath: process.env.CHROME_PATH };
  }

  if (process.platform === "win32") {
    return { channel: "chrome" };
  }

  return {};
}
