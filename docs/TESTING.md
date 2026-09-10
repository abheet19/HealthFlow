# HealthFlow — testing artifact

## Current recheck — 2026-09-10

The complete workflow was rerun on 2026-09-10 after clinic isolation was added. The maintained recorder completed all five departments in two independent browser contexts, persisted synthetic `Demo Patient` as `PID-20260910-b21bbc30` to PostgreSQL, downloaded a 155,133-byte DOCX, and captured 62 source frame pairs. The detailed browser suite then passed 14 grouped workflow checks, and the focused navigation suite passed eight route/menu/home-link checks, all with zero page errors. A separate three-client live Socket.IO probe delivered one department event to the same-clinic peer and zero to the sender and other-clinic peer. Persisted API probes showed one clinic could neither list the other clinic's synthetic row nor generate its report. The machine-readable workflow result and current synthetic screenshots are retained in `docs/verification/`; the exact release mapping is recorded during deployment.

Frontend lint and the production build passed. The exact Docker build produced a 149.95 kB gate entry (48.44 kB gzip); after unlock, `WorkspaceApp` loads as a separate 242.28 kB chunk (79.72 kB gzip), followed by the selected department route. The exact Nginx + Python 3.12 + PostgreSQL 17 Docker bundle passed the browser suites with zero page errors. All 11 backend tests passed, covering seven credential/realtime cases, two persisted clinic-query cases, and two DOCX regressions. The guarded Fly release passed four public smoke checks, and the recorded Lighthouse 13.4.1 run measured mobile 88/100 performance and desktop 95/100, with Accessibility, Best Practices and SEO at 100/100 on both profiles. Lighthouse remains a dated lab sample rather than a production field measurement.

## Environment and safety

Full workflows ran against the exact isolated Docker stack: **PostgreSQL 17**, Flask/Gunicorn on **Python 3.12.14** at loopback port 58101, and the production Vite bundle served by Nginx at loopback port 58100. The default demo flow used clinic `demo` and user `demo-user`; a second backend used exact credentials for two synthetic clinics. Browser contexts shared neither localStorage nor sessionStorage; department changes arrived through real Socket.IO. Only synthetic test records were used. No deployed database or public patient workflow was touched.

This is guided browser automation with observed screenshots, DOM values, actual network, stored database values and an actual generated DOCX. It is not a claim that every theoretical path, medical condition, supported browser or load level was exhaustively verified.

## Reproduce the main local flow

1. Start the repository's disposable local stack with `docker compose up --build -d`. It creates a project-scoped PostgreSQL volume, waits for database readiness, and uses clinic `demo`, user `demo-user`, and synthetic code `synthetic-local-test` unless an untracked local `.env` overrides them. Multi-clinic testing should provide `HEALTHFLOW_IDENTITIES_JSON` as a runtime secret. Do not point the stack at production.
2. Run source checks independently with `cd frontend; npm ci --legacy-peer-deps; npm run lint; npm run build` and `cd backend; python -m pip install -r requirements.txt; python -m pip check; python -m unittest discover -s tests -v`.
3. In `tools/`, install its lockfile dependencies with `npm ci`. Set `CHROME_PATH` to use a specific browser; otherwise the scripts use Chrome on Windows and Playwright Chromium on Linux. Run `BASE_URL=http://127.0.0.1:3000 API_URL=http://127.0.0.1:5000 node record-demo.mjs`. Both origins must be loopback, and the recorder stops immediately if the frontend or database-aware API health probe fails.
4. Observe IT register a patient and fill synthetic intake/photo data. ENT must receive the ID through Socket.IO. Save ENT, Vision, General and Dental, then use IT's final Submit. The Patients page must show the new row and its Word Doc action must download a report. Repairing a dropped field manually is not an acceptable pass.
5. Inspect `.frames/manifest.json` and the generated DOCX. Expected sample values include Demo Patient, 142 cm, 36 kg, BMI 17.85, BP 104/68 and vision 6/6; template placeholders must be expanded. Compare the stored PostgreSQL row to these values. `python build-gif.py` creates the README GIF from the captured frames.
6. Run `BASE_URL=http://127.0.0.1:3000 npm run verify` on the same isolated stack for the extra controls below. It runs both the detailed workflow suite and the route-recovery/home-link suite. The workflow test uses a fresh draft but expects the recorder's stored synthetic row for list/search checks. Output defaults to the repository's `docs/verification/` folder; set `VERIFICATION_DIR` to override it.
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
| Mobile / Lock | 390 px navigation works; Lock clears current-tab clinic/user/secret/draft and restores gate | Passed |
| Route recovery / navigation | All six menu links open the expected page; unknown URLs explain the problem and return to IT; the brand link returns home | Passed in eight focused browser checks |
| Tablet | Main recording at 640 px has no observed overflow | Passed in current recording |
| HTTP/CORS/socket | Unauthenticated API 401; valid session 200; OPTIONS allowed; no-code socket rejected | Passed |
| Invalid report | Missing `patientId` gives 400; absent synthetic ID gives 404 | Passed |
| Bounded read burst (2026-09-08) | 20 local API reads at concurrency 4 | 20/20 HTTP 200; mean 8.3 ms, max 36.62 ms |
| Database outage / recovery | Stop Compose database, call `/health`, restart database, call `/health` again | Python 3.12 recheck: HTTP 503 `{"database":"unavailable","status":"degraded"}` in 2.035 s; HTTP 200 `{"database":"ok","status":"ok"}` on the first one-second recovery poll |

There is no measured statement or branch coverage percentage. The clinic probes establish the tested boundaries for this single-process candidate; they do not prove role authorization, same-clinic concurrent patient ownership, multi-process delivery, or clinical compliance. The read burst does not establish sustained capacity or production latency. The outage check establishes bounded readiness behavior for one local stop/restart, not automatic failover, data recovery, or backup restore.

## Operational behavior and evidence paths

`backend/app/config.py` prefers `DATABASE_URL`, normalizes a legacy `postgres://` scheme, and otherwise constructs a PostgreSQL URL from `POSTGRES_*` values. The SQLAlchemy engine uses `pool_pre_ping=True`, `pool_timeout=1` and Psycopg `connect_timeout=1`. Pre-ping rejects stale pooled connections before a request uses them; the timeouts bound pool acquisition and connection establishment. These values do not create retries, failover, or a backup strategy.

`backend/server.py` runs the blocking `SELECT 1` probe through `eventlet.tpool` and wraps it in a two-second Eventlet timeout. `/health` returns 200 only after the query succeeds and 503 with generic database-unavailable metadata otherwise. The measured 2.035-second Python 3.12 outage response is consistent with that bound plus HTTP overhead. `backend/fly.toml` asks Fly to call `/health` every 30 seconds with a 15-second grace period and five-second probe timeout.

Every HTTP response receives `X-Request-ID` and `Server-Timing: app;dur=…`. A caller-supplied request ID is accepted only when it is at most 64 characters and contains alphanumerics or `-_.`; otherwise the server generates one. Runtime request logs contain request ID, method, `request.path`, status and duration. They do not log query strings, access codes, bodies, reports, photos, or patient fields. This is useful correlation and timing evidence, not tracing, metrics storage, or an error-monitoring product.

Current evidence is in:

- `docs/TESTING.md` — commands, measured results, operational behavior, and remaining limits.
- `docs/verification/extra-browser-results.json` and `docs/verification/*.png` — the 14-check result and synthetic desktop/mobile states.
- `docs/screenshots/` and `docs/demo/healthflow-demo.gif` — current README media.
- `backend/tests/test_access_and_realtime.py` — exact credential, room isolation, private-user-room and invalid-event regressions.
- `backend/tests/test_patient_scope.py` — clinic-bound list and report query regressions.
- `backend/tests/test_report.py` — the two maintained DOCX content regressions.
- `tools/record-demo.mjs`, `tools/verify-workflows.mjs` and `tools/verify-navigation.mjs` — executable browser acceptance paths.

The recorder manifest and generated DOCX remain in gitignored `tools/.frames/`. Earlier bounded-load and release evidence is dated in the existing study pack; it must not be presented as a measurement of the current working tree.

## Deployment, CI and local hooks

The frontend is a Vite bundle built in a Node container and served by Nginx. `frontend/src/App.tsx` keeps the unauthenticated access boundary small and lazy-loads `WorkspaceApp` only after the tab has a validated code. `WorkspaceApp` then mounts MUI, routing, the shared patient/socket and toast providers, and lazy department routes behind `React.Suspense`. The backend image uses Python 3.12, installs explicitly pinned direct dependencies and PostgreSQL client tools, then starts one Gunicorn Eventlet worker through `backend/entrypoint.sh`. PostgreSQL is a separate stateful service.

Docker Compose wires PostgreSQL 17, the backend and frontend together. The database has a `pg_isready` health check; the backend waits on `service_healthy`. Compose passes the fixed synthetic demo clinic/user/code and loopback CORS origins, and bakes the public default clinic/user plus API/socket URLs into the frontend image. A multi-clinic deployment supplies `HEALTHFLOW_IDENTITIES_JSON` only at runtime. Build-time `VITE_*` values are public configuration, not secrets.

Fly deploys two apps: `healthflow-api-abheet19` for Flask/Socket.IO and `healthflow-abheet19` for static Nginx assets. Both can stop when idle. Fly routes HTTPS and starts machines; it does not add same-clinic workflow isolation or a cross-machine Socket.IO broker. Backend secrets are `DATABASE_URL` plus either the legacy demo code or the multi-identity JSON map and belong in Fly secrets. `HEALTHFLOW_REQUIRE_ACCESS_CODE`, `CORS_ORIGINS`, `LOG_LEVEL` and `PORT` are runtime configuration. Record the exact Git commit, CI run, and both Fly releases before calling any candidate deployed.

The guarded 10 September 2026 application release maps commit 8ffae57dbec52507a64cac7c22d1fe77827e18ac to successful [CI run 34434634788](https://github.com/abheet19/HealthFlow/actions/runs/34434634788), backend Fly v8 (sha256:01a3cf5f8f9b87d777ecb90ecba2b353a336a27e171a4394d62e42f72e350623) and frontend Fly v11 (sha256:19f0fe9c320ec6fa6d33b2e480a8175a14d4d4b546cd6ec517470c947a0c2c66). The backend OCI label names the exact commit. A Fly-configured local build of that commit matched the live frontend HTML, entry JavaScript, workspace JavaScript and CSS byte-for-byte. Post-deploy checks returned frontend/brand 200, database-aware health 200, anonymous session 401, and four browser checks with zero unexpected failures or console/page errors.

`.github/workflows/ci.yml` enforces two independent gates on pushes to `main` and pull requests. `source-checks` runs frontend install/lint/build plus Python 3.12 dependency and DOCX unit checks. `synthetic-workflow` builds the three Docker services, waits for the database-aware health endpoint, records the five-department path, runs the 14 grouped browser checks and eight navigation checks, uploads acceptance evidence, prints container logs on failure, and always stops the stack. There is no versioned local pre-commit hook; the equivalent manual gates are:

- Frontend: `cd frontend; npm ci; npm run lint; npm run build`
- Backend: `cd backend; python -m unittest discover -s tests`
- Browser: isolated stack, then `tools/record-demo.mjs` and `npm run verify`
- Release: `fly status`, `fly releases`, `fly logs`, `/health`, unauthenticated API 401, and the access gate

Deploy from `backend/` and `frontend/` with `fly deploy --app <app> --build-arg HEALTHFLOW_REVISION=<tested-full-git-sha>` so each new image records its source. Record the tested commit and image for any real release. Re-deploying a previously verified image is an application rollback; database changes still require a compatible migration/restore plan.

## Security, privacy and known limits

The exact clinic/user/secret triple is checked on every `/api/*` request and in the Socket.IO handshake. The authenticated clinic is placed on Flask's request context and Socket.IO's server-side connection map; client event payloads never choose a destination room. Stored list/report queries and final inserts use that authenticated clinic. CORS preflight is allowed before authentication so browsers can send custom headers. The credentials and draft are stored in `sessionStorage`; Lock clears the current tab. HTTP and Socket.IO payload sizes are capped at 2 MiB. Values are parameterized in SQL, and failed inserts roll back.

This remains a configured-secret demonstration boundary. It has no external identity provider, MFA, per-role authorization, consent, clinical audit trail, session revocation, retention policy, formal encryption program, or compliance review. A user with one clinic/user secret can access that clinic's demo records. Use synthetic records only.

Not verified or implemented as complete: simultaneous distinct patient workflows inside one clinic, workflow/patient rooms, ownership or roles, offline reconciliation/replay, multi-machine Socket.IO without a broker, sustained production stress, all malformed image variants, a complete accessibility/cross-browser matrix, backup restore, a migration framework, or clinical compliance. The idempotent initializer adds `clinic_id` and defaults existing rows to the explicit `demo` clinic; a real rollout must deliberately map existing rows and rehearse rollback. Eventlet emits a deprecation warning and needs a planned maintained-runtime migration. Full page-image visual QA of the DOCX remains blocked because LibreOffice is unavailable; structured content and the two targeted regressions passed.

The report regressions protect two concrete failures: the VISION section uses acuity fields `rev`/`lev` rather than colour-blindness fields `rcb`/`lcb`, and an undecodable photo does not prevent the rest of the report from rendering. The template keeps its surrounding Word run styles. These checks inspect structured content; they are not a page-layout certification.
