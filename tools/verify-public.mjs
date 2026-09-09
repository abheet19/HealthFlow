import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const frontend = process.env.PUBLIC_FRONTEND_URL || 'https://healthflow-abheet19.fly.dev';
const backend = process.env.PUBLIC_BACKEND_URL || 'https://healthflow-api-abheet19.fly.dev';
const evidence = fileURLToPath(new URL('../docs/verification/', import.meta.url));
await mkdir(evidence, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const httpFailures = [];
const checks = [];
page.on('pageerror', error => errors.push(`page: ${error.message}`));
page.on('console', message => {
  if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
    errors.push(`console: ${message.text()}`);
  }
});
page.on('response', response => {
  if (response.status() >= 400) httpFailures.push({ status: response.status(), url: response.url() });
});

try {
  const response = await page.goto(frontend, { waitUntil: 'networkidle', timeout: 45_000 });
  assert.equal(response?.status(), 200);
  await page.getByRole('heading', { name: 'HealthFlow', exact: true }).waitFor();
  await page.getByLabel('Workspace access code').waitFor();
  checks.push('public frontend serves the access gate');

  await page.getByRole('button', { name: 'Open workspace' }).click();
  await page.getByText('Enter the clinic workspace access code.').waitFor();
  checks.push('empty access code is rejected in the browser');

  await page.getByLabel('Workspace access code').fill('definitely-not-the-code');
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await page.getByText('That workspace code is not valid.').waitFor({ timeout: 20_000 });
  assert.equal(await page.evaluate(() => sessionStorage.length), 0);
  checks.push('invalid code is rejected by the deployed backend and is not stored');

  const health = await page.request.get(`${backend}/health`, { timeout: 20_000 });
  assert.equal(health.status(), 200);
  assert.deepEqual(await health.json(), { database: 'ok', status: 'ok' });
  assert.ok(health.headers()['x-request-id']);
  assert.match(health.headers()['server-timing'] || '', /^app;dur=/);
  checks.push('deployed health probe verifies PostgreSQL and exposes safe timing headers');

  await page.screenshot({ path: `${evidence}/public-access-gate.png`, fullPage: true });
  const unexpectedHttpFailures = httpFailures.filter(
    failure => failure.status !== 401 || !failure.url.endsWith('/api/session'),
  );
  assert.deepEqual(unexpectedHttpFailures, []);
  assert.deepEqual(errors, []);
  const result = {
    at: new Date().toISOString(),
    environment: 'deployed Fly frontend and backend; unauthenticated boundary only',
    checks,
    expectedHttpFailures: httpFailures.filter(failure => failure.status === 401),
    errors,
  };
  await writeFile(`${evidence}/public-smoke-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ checks: checks.length, errors }));
} finally {
  await browser.close();
}
