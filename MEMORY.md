# HealthFlow project memory

> Updated 11 September 2026. This is the compact handoff for an AI or engineer resuming the
> repository. Source and executable checks take precedence over prose.

## Product and safety boundary

HealthFlow demonstrates one synthetic health-camp checkup across IT intake, ENT, Vision, General,
and Dental. Authenticated tabs in one configured clinic share an active draft through Socket.IO;
IT submits the combined record to PostgreSQL; Patients List searches the clinic's rows and
downloads a templated DOCX. Never use real personal or health data. Clinic/user/code credentials
are an exact fail-closed demo boundary, not SSO, MFA, roles, consent, audit, retention, encryption
governance, or clinical compliance.

## Decisions that must survive

- The backend derives clinic and user rooms from the authenticated connection. Event payloads must
  never choose a room. HTTP list/report/insert scope comes from the authenticated clinic.
- Credentials and drafts live in `sessionStorage`; Lock removes all of them. `localStorage` draft
  residue is cleared for older builds.
- Field patches emit immediately. Do not reintroduce debounced full-object writes: they previously
  risked overwriting rapid edits or a save/reset.
- Final persistence is a transaction after all five department sections validate. Draft broadcasts
  are not commits.
- The access gate, authenticated workspace, and department pages are separate Vite chunks. The
  prepaint gate protects first paint without hiding the actual app from assistive technology after
  React mounts.
- Deploy API first and frontend second. Supply the same full `HEALTHFLOW_REVISION` build arg to
  both. API `/health` and frontend `/release.json` must match the tested SHA.
- Public smoke never uses a valid deployment secret. Full patient workflows stay in disposable
  local/CI PostgreSQL with synthetic data.

## Current verification contract

- Frontend: `npm ci --legacy-peer-deps`, ESLint with zero warnings, TypeScript/Vite production
  build, and `npm audit --omit=dev`. Production dependencies are clean; eight advisories remain in
  the build/lint-only Vite 4/ESLint 8 tree and require a separately tested major toolchain migration.
- Backend: pinned Python packages, `pip check`, zero known vulnerabilities from `pip-audit`, and 11
  tests covering exact identity configuration, realtime clinic/user rooms, invalid events,
  clinic-bound list/report queries, and DOCX behavior. Pillow/python-dotenv pins were advanced after
  a release audit.
- Browser: the recorder completes all departments and validates the stored row/DOCX; `npm run
  verify` adds 14 workflow, 17 desktop/320 px navigation, and 12 failure/recovery/accessibility
  checks.
- Failure paths: incomplete/wrong/unavailable access, patient-list skeleton/error/refresh, report
  error/redownload, socket disconnect/reconnect, invalid form, unknown route, and database
  stop/restart.
- Accessibility/responsive: skip link, one main landmark and page heading, named controls, pressed toggle state,
  24 px automated target floor, every route at 320 px, reduced page overflow risk. Automated
  results are not independent WCAG certification.
- Performance: current build is 149.91 kB (48.51 kB gzip) for the locked entry and 242.38 kB
  (79.81 kB gzip) for `WorkspaceApp`. Pinned Lighthouse 13.0.1 scores 100 in all four categories on
  mobile and desktop; mobile FCP/LCP 1.1 s, TBT 0 ms, CLS 0 in the dated lab run. Public smoke adds
  a 12-request health burst with a 5 s p95 release budget.
- Local hook: `git config core.hooksPath .githooks`; the native hook runs staged whitespace,
  frontend lint/build, and backend tests. Husky and a repository-wide autoformatter are absent.

## Release and evidence

The repository lives at `https://github.com/abheet19/HealthFlow`. Public services are
`https://healthflow-abheet19.fly.dev` and `https://healthflow-api-abheet19.fly.dev`. CI is
`.github/workflows/ci.yml`; Fly is an explicit manual release, not automatic deployment on push.
For the latest exact SHA, CI run IDs, Fly release IDs/digests, public metrics, and unresolved
external checks, read
`C:\Users\abhee\OneDrive\Documents\ChatGPT\code\verification-work\portfolio-release-20260910\HEALTHFLOW_RELEASE_SIGNOFF_20260910.md`.

The external learning guide is `D:\Work\HealthFlow Study Pack`. Read `CONTEXT.md`,
`docs/USAGE.md`, then that pack's `00_README_Start_Here.md`, concepts, system-design walkthrough,
and testing artifact.

## Known limits

- One clinic has one active draft. There are no patient/workflow rooms, ownership revisions,
  durable drafts, offline replay, or conflict resolution.
- One Eventlet worker has no shared Socket.IO broker or demonstrated horizontal behavior. Eventlet
  replacement remains planned.
- Schema initialization is additive and idempotent, not a migration framework. Production data
  mapping, backup restore, and disaster recovery are not proven.
- DOCX tests inspect package/content. LibreOffice/Office pagination and cross-suite visual rendering
  remain unverified.
- No continuous deployment, production field Core Web Vitals, sustained stress result, complete
  browser/screen-reader matrix, formal penetration test, or healthcare compliance assessment.

## Resume safely

1. Run `git status --short --branch`; preserve unrelated work.
2. Read `CONTEXT.md`, `docs/USAGE.md`, and `docs/TESTING.md`.
3. Use only synthetic data and an isolated database.
4. Run source/backend gates before the Docker recorder and browser checks.
5. Treat a green tree as deployed only after CI, both Fly releases, matched HTTP SHAs, and public
   smoke all point to the same commit.
