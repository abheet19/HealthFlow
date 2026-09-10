# HealthFlow — testing artifact

## Current release check — 2026-09-11

The maintained recorder completes all five departments in two independent browser contexts, persists synthetic `Demo Patient` to PostgreSQL, downloads and inspects a DOCX, and captures 62 source frame pairs. The current browser gate adds 14 grouped workflow checks, 17 desktop/320 px navigation checks, and 12 loading/failure/recovery/accessibility checks. A three-client Socket.IO regression delivers an event to the same-clinic peer and never to the sender or another clinic. Persisted API regressions prove one clinic can neither list another clinic's row nor generate its report. GitHub CI reruns this exact production-shaped stack for every pushed release; its downloadable artifact is the release evidence for the tested SHA.

Frontend lint and the production build pass with a 149.91 kB gate entry (48.51 kB gzip); after unlock, `WorkspaceApp` loads as a separate 242.38 kB chunk (79.81 kB gzip), followed by the selected department route. All 11 backend tests pass: seven credential/realtime cases, two persisted clinic-query cases, and two DOCX regressions. Production dependency audits report zero known npm vulnerabilities in the frontend and verifier lockfiles. A backend `pip-audit` initially found reachable advisories in Pillow 11.3.0 and python-dotenv 1.2.1; the direct pins were advanced to patched Pillow 12.3.0 and python-dotenv 1.2.2, after which `pip check`, all 11 tests, and `pip-audit` passed with zero known backend vulnerabilities. The full frontend dependency tree still reports eight build/lint-only advisories through the Vite 4/ESLint 8 toolchain; those packages are absent from the final Nginx image, and a separately tested major toolchain migration remains open. Pinned Lighthouse 13.0.1 lab runs against the current production build score 100/100 for Performance, Accessibility, Best Practices, and SEO on mobile and desktop; mobile FCP/LCP are 1.1 s, TBT 0 ms, and CLS 0. Lighthouse is a lab sample and automated accessibility check, not field data or independent WCAG certification.

## Environment and safety

Full workflows run in GitHub's isolated Docker stack: **PostgreSQL 17**, Flask/Gunicorn on **Python 3.12**, and the production Vite bundle served by Nginx. The default demo flow uses clinic `demo`, user `demo-user`, and a synthetic-only code; separate backend regressions use two exact synthetic clinic identities. Browser contexts share neither localStorage nor sessionStorage; department changes arrive through real Socket.IO. Public verification is limited to the access boundary, revision endpoints, and database health. It does not use a valid deployment secret or touch a patient workflow.

This is guided browser automation with observed screenshots, DOM values, actual network, stored database values and an actual generated DOCX. It is not a claim that every theoretical path, medical condition, supported browser or load level was exhaustively verified.

## Reproduce the main local flow

1. Pin the image labels to the source under test, then start the repository's disposable local stack: PowerShell: `$env:HEALTHFLOW_REVISION = git rev-parse HEAD; docker compose up --build -d`; bash: `HEALTHFLOW_REVISION=$(git rev-parse HEAD) docker compose up --build -d`. Compose otherwise labels both local images `local-unpinned`, which is deliberately honest but insufficient as release evidence. The stack creates a project-scoped PostgreSQL volume, waits for database readiness, and uses clinic `demo`, user `demo-user`, and synthetic code `synthetic-local-test` unless an untracked local `.env` overrides them. Multi-clinic testing should provide `HEALTHFLOW_IDENTITIES_JSON` as a runtime secret. Do not point the stack at production.
2. Run source checks independently with `cd frontend; npm ci --legacy-peer-deps; npm run lint; npm run build` and `cd backend; python -m pip install -r requirements.txt; python -m pip check; python -m unittest discover -s tests -v`.
3. In `tools/`, install its lockfile dependencies with `npm ci`. Set `CHROME_PATH` to use a specific browser; otherwise the scripts use Chrome on Windows and Playwright Chromium on Linux. Run `BASE_URL=http://127.0.0.1:3000 API_URL=http://127.0.0.1:5000 node record-demo.mjs`. Both origins must be loopback, and the recorder stops immediately if the frontend or database-aware API health probe fails.
4. Observe IT register a patient and fill synthetic intake/photo data. ENT must receive the ID through Socket.IO. Save ENT, Vision, General and Dental, then use IT's final Submit. The Patients page must show the new row and its Word Doc action must download a report. Repairing a dropped field manually is not an acceptable pass.
5. Inspect `.frames/manifest.json` and the generated DOCX. Expected sample values include Demo Patient, 142 cm, 36 kg, BMI 17.85, BP 104/68 and vision 6/6; template placeholders must be expanded. Compare the stored PostgreSQL row to these values. `python build-gif.py` creates the README GIF from the captured frames.
6. Run `BASE_URL=http://127.0.0.1:3000 npm run verify` on the same isolated stack. It runs the detailed workflow, route/navigation, and failure/recovery/accessibility suites. The tests use a fresh draft but expect the recorder's stored synthetic row for list/search/report checks. Output defaults to `docs/verification/`; set `VERIFICATION_DIR` to keep release evidence outside the working tree.
7. Stop local servers and dispose of the explicitly created test database/cluster when no other local tests need it. Never use a broad delete or a production cleanup query as a substitute for isolation.

## Acceptance matrix

| Area | Acceptance condition | Measured/observed result |
|---|---|---|
| Access gate | Incomplete/wrong clinic credentials stay on the gate; valid exact clinic/user/secret creates HTTP and Socket.IO access | Passed; wrong clinic/secret rejected by backend before unlock |
| Registration / live ID | IT generates a candidate ID; a same-clinic independent department receives it | Passed through the authenticated clinic room |
| Realtime clinic isolation | Event destination comes from the authenticated socket, not client payload; another clinic receives nothing | Passed with three live Eventlet Socket.IO clients: sender 0, same clinic 1, other clinic 0 |
| User room | A server message to one authenticated user's room is not delivered to a same-clinic peer | Passed in backend Socket.IO regression |
| Persisted clinic isolation | Patient list/report bind the authenticated clinic; cross-clinic report appears absent | Passed with one synthetic row per clinic and cross-clinic HTTP 404 |
| Rapid intake | Fast text/date edits survive without repair pauses | Passed; all entered values retained |
| Photo | Upload, hide/show and delete a synthetic image | Passed |
| ENT | Complete left/right ear, nose and throat controls; Save marks the section complete | Passed |
| Vision | Complete both eyes' acuity, colour-blindness and squint controls; Save marks complete | Passed |
| General | Measurements derive BMI; conditional descriptions and four NA controls behave correctly | Passed; 17.85 persisted in main flow and 25.00 displayed for 160 cm/64 kg |
| Dental | Tooth groups, remarks NA and validation behave; complete form saves | Passed, including incomplete-form error |
| Final write | IT sends all five sections once; reload reads the new PostgreSQL row | Passed; expected values persisted |
| DOCX | Download and inspect package/content for patient, measurements, vision and department values | Passed; 155,133-byte report |
| Reset | IT Reset All Data returns a same-clinic independent department to waiting | Passed |
| Patients | Search existing/missing name, Refresh, and download Word Doc | Passed, including empty-result and success feedback |
| Mobile / Lock | Every route works at 320 px without page overflow; Lock clears current-tab clinic/user/secret/draft and restores gate | Enforced in browser CI |
| Route recovery / navigation | All six links work on desktop and mobile; both unknown-route CTAs, brand home, skip link, and Escape-close work | 17 focused checks |
| Failure / recovery | Access pending/network failure/retry, patient skeleton/fetch failure/refresh, report failure/redownload, socket disconnect/reconnect | 12 grouped checks including six route accessibility contracts |
| Tablet | Main recording at 640 px has no observed overflow | Passed in current recording |
| HTTP/CORS/socket | Unauthenticated API 401; valid session 200; OPTIONS allowed; no-code socket rejected | Passed |
| Invalid report | Missing `patientId` gives 400; absent synthetic ID gives 404 | Passed |
| Bounded read burst (2026-09-08) | 20 local API reads at concurrency 4 | 20/20 HTTP 200; mean 8.3 ms, max 36.62 ms |
| Database outage / recovery | Stop Compose database, require bounded HTTP 503, restart, and require HTTP 200 | Enforced in CI; both bodies retain the exact `release` SHA |

There is no measured statement or branch coverage percentage. The clinic probes establish the tested boundaries for this single-process candidate; they do not prove role authorization, same-clinic concurrent patient ownership, multi-process delivery, or clinical compliance. The read burst does not establish sustained capacity or production latency. The outage check establishes bounded readiness behavior for one local stop/restart, not automatic failover, data recovery, or backup restore.

## Operational behavior and evidence paths

`backend/app/config.py` prefers `DATABASE_URL`, normalizes a legacy `postgres://` scheme, and otherwise constructs a PostgreSQL URL from `POSTGRES_*` values. The SQLAlchemy engine uses `pool_pre_ping=True`, `pool_timeout=1` and Psycopg `connect_timeout=1`. Pre-ping rejects stale pooled connections before a request uses them; the timeouts bound pool acquisition and connection establishment. These values do not create retries, failover, or a backup strategy.

`backend/server.py` runs the blocking `SELECT 1` probe through `eventlet.tpool` and wraps it in a two-second Eventlet timeout. `/health` returns 200 only after the query succeeds and 503 with generic database-unavailable metadata otherwise; both states expose the non-secret Git `release`. `backend/fly.toml` asks Fly to call `/health` every 30 seconds with a 15-second grace period and five-second probe timeout.

Every HTTP response receives `X-Request-ID` and `Server-Timing: app;dur=…`. A caller-supplied request ID is accepted only when it is at most 64 characters and contains alphanumerics or `-_.`; otherwise the server generates one. Runtime request logs contain request ID, method, `request.path`, status and duration. They do not log query strings, access codes, bodies, reports, photos, or patient fields. This is useful correlation and timing evidence, not tracing, metrics storage, or an error-monitoring product.

Current evidence is in:

- `docs/TESTING.md` — commands, measured results, operational behavior, and remaining limits.
- `docs/verification/extra-browser-results.json`, `resilience-results.json`, and `*.png` — detailed workflow, failure/recovery, and synthetic desktop/320 px states.
- `docs/screenshots/` and `docs/demo/healthflow-demo.gif` — current README media.
- `backend/tests/test_access_and_realtime.py` — exact credential, room isolation, private-user-room and invalid-event regressions.
- `backend/tests/test_patient_scope.py` — clinic-bound list and report query regressions.
- `backend/tests/test_report.py` — the two maintained DOCX content regressions.
- `tools/record-demo.mjs`, `verify-workflows.mjs`, `verify-navigation.mjs`, `verify-resilience.mjs`, and `verify-public.mjs` — executable browser and release acceptance paths.

The recorder manifest and generated DOCX remain in gitignored `tools/.frames/`. Earlier bounded-load and release evidence is dated in the existing study pack; it must not be presented as a measurement of the current working tree.

## Deployment, CI and local hooks

The frontend is a Vite bundle built in a Node container and served by Nginx. `frontend/src/App.tsx` keeps the unauthenticated access boundary small and lazy-loads `WorkspaceApp` only after the tab has a validated code. `WorkspaceApp` then mounts MUI, routing, the shared patient/socket and toast providers, and lazy department routes behind `React.Suspense`. The backend image uses Python 3.12, installs explicitly pinned direct dependencies and PostgreSQL client tools, then starts one Gunicorn Eventlet worker through `backend/entrypoint.sh`. PostgreSQL is a separate stateful service.

Docker Compose wires PostgreSQL 17, the backend and frontend together. The database has a `pg_isready` health check; the backend waits on `service_healthy`. Compose passes the fixed synthetic demo clinic/user/code and loopback CORS origins, bakes the public default clinic/user plus API/socket URLs into the frontend image, and forwards `HEALTHFLOW_REVISION` into both OCI image labels and public release probes. CI supplies the exact GitHub SHA; an unpinned local caller gets the explicit `local-unpinned` value. A multi-clinic deployment supplies `HEALTHFLOW_IDENTITIES_JSON` only at runtime. Build-time `VITE_*` values are public configuration, not secrets.

Fly deploys two apps: `healthflow-api-abheet19` for Flask/Socket.IO and `healthflow-abheet19` for static Nginx assets. Both can stop when idle. Fly routes HTTPS and starts machines; it does not add same-clinic workflow isolation or a cross-machine Socket.IO broker. Backend secrets are `DATABASE_URL` plus either the legacy demo code or the multi-identity JSON map and belong in Fly secrets. `HEALTHFLOW_REQUIRE_ACCESS_CODE`, `CORS_ORIGINS`, `LOG_LEVEL` and `PORT` are runtime configuration. Record the exact Git commit, CI run, and both Fly releases before calling any candidate deployed.

For every release, record `source SHA -> successful CI run -> backend Fly release/image -> frontend Fly release/image -> public smoke`. The public verifier requires a 40-character SHA from frontend `/release.json`, the same SHA from backend `/health`, and an optional exact `EXPECTED_REVISION`; it also checks safe access failure/recovery, 320 px controls, CLS, and a 12-request bounded health burst. Deployment IDs and measured public results belong in the release evidence directory instead of a stale hard-coded paragraph here.

`.github/workflows/ci.yml` enforces two independent gates on pushes to `main` and pull requests. `source-checks` runs a whitespace guard, frontend install/lint/build, Python 3.12 dependency compatibility, and 11 backend tests. `synthetic-workflow` builds the three Docker services, proves both containers identify the GitHub SHA, records the five-department path, runs 43 grouped browser checks, stops/restarts PostgreSQL to prove bounded degradation/recovery, uploads evidence, prints logs on failure, and always stops the stack.

The repository uses a dependency-free native pre-commit hook rather than adding Husky to a split Python/Node project. Enable it once per clone with `git config core.hooksPath .githooks`. It runs staged whitespace validation, frontend lint/build, and backend tests. There is no repository-wide autoformatter; ESLint, TypeScript, `git diff --check`, and review are the versioned style gates.

- Frontend: `cd frontend; npm ci; npm run lint; npm run build`
- Backend: `cd backend; python -m unittest discover -s tests`
- Browser: isolated stack, then `tools/record-demo.mjs` and `npm run verify`
- Release: `fly status`, `fly releases`, `fly logs`, `/health`, unauthenticated API 401, and the access gate

Deploy from `backend/` and `frontend/` with `fly deploy --app <app> --build-arg HEALTHFLOW_REVISION=<tested-full-git-sha>` so each new image and HTTP release probe records its source. Deploy the API first, require database health, then deploy the frontend and run `EXPECTED_REVISION=<sha> npm run verify:public`. Re-deploying a previously verified image is an application rollback; database changes still require a compatible migration/restore plan. Continuous deployment is intentionally not enabled, so a green source push never changes the public database-backed demo without an explicit release command.

## Security, privacy and known limits

The exact clinic/user/secret triple is checked on every `/api/*` request and in the Socket.IO handshake. The authenticated clinic is placed on Flask's request context and Socket.IO's server-side connection map; client event payloads never choose a destination room. Stored list/report queries and final inserts use that authenticated clinic. CORS preflight is allowed before authentication so browsers can send custom headers. The credentials and draft are stored in `sessionStorage`; Lock clears the current tab. HTTP and Socket.IO payload sizes are capped at 2 MiB. Values are parameterized in SQL, and failed inserts roll back.

This remains a configured-secret demonstration boundary. It has no external identity provider, MFA, per-role authorization, consent, clinical audit trail, session revocation, retention policy, formal encryption program, or compliance review. A user with one clinic/user secret can access that clinic's demo records. Use synthetic records only.

Not verified or implemented as complete: simultaneous distinct patient workflows inside one clinic, workflow/patient rooms, ownership or roles, offline reconciliation/replay, multi-machine Socket.IO without a broker, sustained production stress, all malformed image variants, a complete accessibility/cross-browser matrix, backup restore, a migration framework, or clinical compliance. The idempotent initializer adds `clinic_id` and defaults existing rows to the explicit `demo` clinic; a real rollout must deliberately map existing rows and rehearse rollback. Eventlet emits a deprecation warning and needs a planned maintained-runtime migration. Full page-image visual QA of the DOCX remains blocked because LibreOffice is unavailable; structured content and the two targeted regressions passed.

The report regressions protect two concrete failures: the VISION section uses acuity fields `rev`/`lev` rather than colour-blindness fields `rcb`/`lcb`, and an undecodable photo does not prevent the rest of the report from rendering. The template keeps its surrounding Word run styles. These checks inspect structured content; they are not a page-layout certification.
