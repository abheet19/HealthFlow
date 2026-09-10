# HealthFlow usage guide

HealthFlow is a synthetic clinic-workflow demonstration. Never enter real patient, school,
employee, or health data. Its configured clinic/user/code boundary is suitable for a portfolio
demo; it is not SSO, role authorization, consent, audit, retention, or clinical compliance.

## Start and unlock

1. Follow the Docker setup in the repository `README.md` and wait for
   `http://127.0.0.1:5000/health` to return HTTP 200.
2. Open `http://127.0.0.1:3000`. The disposable Compose defaults are clinic `demo`, user
   `demo-user`, and code `synthetic-local-test`.
3. Use **Lock** when finished. It clears the clinic ID, user ID, secret, and active draft from that
   tab's session storage.

## Complete one synthetic checkup

1. In **IT**, enter synthetic intake fields, add a synthetic image, and select **Register Patient**.
2. Open **ENT**, **Vision**, **General**, and **Dental** in separate authenticated tabs or devices.
   The new patient ID arrives through the clinic's Socket.IO room. Complete each form and select
   **Save**. IT's status cards change to Completed.
3. Return to **IT** and select **Submit**. A successful final submit writes one combined row to
   PostgreSQL and clears the shared active draft.
4. Open **Patients List**, search by the synthetic name, use **Refresh** when needed, and select
   **Word Doc** to download the generated report.

Only one active draft exists per clinic. Do not run simultaneous patients in one clinic: there are
no workflow-specific rooms, durable offline replay, or conflict resolution. A temporary disconnect
shows a connection state and retries; edits made while disconnected are not guaranteed to reach
another tab.

## Keyboard, mobile, and recovery

- Press `Tab` after a page load to reach **Skip to main content**. Every action is keyboard
  reachable and labeled; selected teeth and N/A controls expose pressed state.
- At phone widths, use **Open navigation menu**. All six destinations are verified at 320 px. The
  Patients table scrolls inside its own region instead of widening the page.
- If access validation or patient loading fails, keep the synthetic values and retry **Open
  workspace** or **Refresh**. HealthFlow does not store a failed access code.
- If realtime status reports a lost connection, restore the network and wait for the automatic
  reconnect before continuing. Reset the draft if tabs disagree.

## Verification and release

Read `docs/TESTING.md` for exact source, browser, database-outage, accessibility, performance, and
deployment checks. Install the versioned native pre-commit gate once per clone:

```bash
git config core.hooksPath .githooks
```

The hook runs staged whitespace checks, frontend lint/build, and backend tests. CI additionally
builds the production Compose topology, exercises the full five-department flow, checks all routes
at 320 px, and proves database failure/recovery. A deployed frontend exposes `/release.json`; the
API `/health` returns the same Git SHA when both services belong to one release.
