# HealthFlow — testing artifact

Recorded 2026-09-08. Tested source: final workspace changes for access validation, immediate field patches, explicit resets, session-only draft, Lock and responsive navigation; final Git/Fly identifiers are recorded in `release-verification.json` beside this artifact once published.

## Environment and safety

Full workflows ran on **isolated local PostgreSQL 17**, loopback port 55439, Flask at 5059 and Vite at 5179. Two independent browser contexts shared neither localStorage nor sessionStorage; department changes arrived through real Socket.IO. Only synthetic test records were used. No production patient row was created, edited, downloaded or removed by this verification.

This is guided browser automation with observed screenshots, DOM values, actual network, stored database values and actual generated DOCX. It is not a claim that every theoretical path, medical condition, supported browser or load level was exhaustively verified.

## Reproduce the main local flow

1. Create an empty PostgreSQL test database. Do not point `DATABASE_URL` at production.
2. In `backend/`, install `requirements.txt`, set `DATABASE_URL`, `HEALTHFLOW_ACCESS_CODE=synthetic-local-test`, `HEALTHFLOW_REQUIRE_ACCESS_CODE=true`, `CORS_ORIGINS=http://127.0.0.1:5179`, `PORT=5059`; start `python server.py`. It creates the table in this empty test database.
3. In `frontend/`, set `VITE_API_URL=http://127.0.0.1:5059` and `VITE_SOCKET_URL=http://127.0.0.1:5059`; run `npm ci`, `npm run lint`, `npm run build`, then `npm run dev -- --host 127.0.0.1 --port 5179 --strictPort`.
4. In `tools/`, install its lockfile dependencies with `npm ci`. Set `CHROME_PATH` if Chrome is not at the tool's Windows default. Run `node record-demo.mjs`. It rejects non-loopback frontend origins and uses the synthetic local code above.
5. Observe IT register a patient, fill synthetic intake/photo, wait for ENT to receive the ID, save ENT/Vision/General/Dental, then IT final-submit. The patients list must contain the new record and Word Doc must download. No manual repair of a dropped field is an acceptable pass.
6. Inspect `.frames/manifest.json` and the generated DOCX. Expected sample values: Demo Patient, 142cm, 36kg, BMI17.85, BP104/68 and vision6/6; placeholders must be expanded. Compare the stored PostgreSQL row to these values. `python build-gif.py` creates the README GIF from real captured frames.
7. Run `node verify-workflows.mjs` for the extra visible controls below, on the same isolated stack. It uses a fresh draft but expects the recorder's stored synthetic row for search/list checks. Outputs default to `docs/verification` in the current working directory; set `VERIFICATION_DIR` to your evidence folder.
8. Stop local servers and dispose of the explicitly created test database/cluster when no other local tests need it. Never use a broad delete or a production cleanup query as a substitute for isolation.

## Scenario matrix

| Scenario | Steps and expected result | Actual |
|---|---|---|
| Gate empty/wrong code | Submit empty/wrong code; remain on gate with useful error | Passed; backend rejects wrong code before unlock |
| Gate valid / Socket auth | Enter test code in two independent browsers | Passed; dashboards connect |
| Registration / live ID | IT Register Patient; department receives generated ID | Passed via real socket |
| Rapid intake | Fill all text/date fields quickly without repair pauses | Passed; all values retained |
| Photo controls | Upload synthetic image, hide/show preview, delete | Passed |
| ENT / Vision saves | Fill every dropdown; Save; IT tile completed | Passed |
| General and BMI | 142/36 in main flow; 160/64 in extra check | Passed;17.85 persisted and25.00 displayed respectively |
| Conditional descriptions | Nails/Hair/Skin abnormality, Allergy YES, Speech Abnormal | Passed; each input appears, accepts text and hides on opposite choice |
| General NA controls | Toggle BP/Pulse/Hip/Waist NA twice | Passed |
| Dental controls | Toggle permanent/primary tooth choices and remarks NA; submit incomplete form | Passed; selection changes and validation error displayed |
| Dental full save | Complete every dropdown; Save; IT tile completed | Passed |
| Final submit / persistence | Submit five sections; query isolated database | Passed; expected measurements stored |
| DOCX | Download Word Doc; open document package and check fields | Passed;155222-byte corrected report, expected values and no unexpanded template tokens |
| Reset | IT Reset All Data; independent department returns to waiting | Passed |
| Patient list | Search existing/nonexistent name; Refresh | Passed; matching row, empty-result text, success feedback |
| Mobile menu / Lock |390px drawer navigation; Lock | Passed; gate restored and current-session draft/code removed |
| Tablet layout |640px main recording with mobile navigation breakpoint | Final recording regenerated after fixing overflow |
| HTTP/CORS/auth |Unauth API401; valid session200; OPTIONS allowed; no-code socket rejected | Passed |
| Invalid report request |No patientId400; absent synthetic ID404 | Passed |
| Bounded read burst |20 actual local API reads, concurrency4 |20/20 HTTP200; mean8.3ms/max36.62ms in recorded run |

The build and lint passed after source changes. There is no measured coverage percentage. The small read burst does not prove sustained load capacity, database-failover behavior or production p95 latency.

## Evidence and remaining boundaries

Evidence folder: `C:/Users/abhee/OneDrive/Documents/ChatGPT/code/job-search-context/project-verification-2026-09-08/HealthFlow/`. Key files: `extra-browser-results.json`, `boundary-load-results.json`, `full-flow-manifest.json`, `Synthetic_Report.docx`, screenshots and release record. The README GIF was visually inspected and renewed against the current local UI.

Not verified as complete: simultaneous distinct patient workflows (unsupported global workspace), offline edit reconciliation/reconnect replay (not implemented), horizontal Socket.IO operation without a broker, sustained production stress, all malformed image variants, full screen-reader/cross-browser matrix, backup restore, or clinical compliance. A successful local report does not establish any of these. Eventlet emits a deprecation warning and still needs a planned maintained-runtime migration. Access is a shared demo code, not user/role isolation. Use synthetic records only.

## Deployment, secrets, CI and hooks

No versioned `.github/workflows`, `.husky` or `.pre-commit-config.yaml` was found in HealthFlow, and `git config --get core.hooksPath` was empty. There is **no enforced pre-commit or CI test gate**; current checks are explicit commands. Do not claim a green pipeline merely because `npm run build` passed locally.

Frontend quality gate: `cd frontend; npm ci; npm run lint; npm run build`. Backend report regressions: from `backend`, `python -m unittest discover -s tests`. Full browser gate: isolated stack plus `tools/record-demo.mjs` and `tools/verify-workflows.mjs`. PostgreSQL17 local connection settings in the artifact are synthetic fixtures, not deployment credentials.

Deploy backend from `backend/`: `fly deploy --app healthflow-api-abheet19`. Deploy frontend from `frontend/`: `fly deploy --app healthflow-abheet19`. Both use their existing `fly.toml`/Dockerfiles. Backend secrets: `DATABASE_URL` and `HEALTHFLOW_ACCESS_CODE`; set through Fly secrets, never commit them. `HEALTHFLOW_REQUIRE_ACCESS_CODE`, `CORS_ORIGINS` and `PORT` are ordinary runtime configuration. Frontend `VITE_API_URL`/`VITE_SOCKET_URL` are public build arguments, not secrets. Images carry compiled assets/code, not the database.

Verify `fly status --app <app>`, `fly releases --app <app>`, `fly logs --app <app>`, backend `/health`200 and unauthenticated `/api/patients`401. Health currently checks the HTTP process, not database readiness; a200 health response is insufficient to establish stored-report flow. Logs can reveal failure categories; avoid logging patient payloads. Record the tested commit and released image. A rollback means re-deploying a previously verified image (`fly deploy --app <app> --image <verified-image-reference>`) and checking health/access again; database changes require their own compatible migration/restore plan. Do not rotate secrets casually during rollback.

The frontend is a static Vite bundle served by Nginx. The backend is a Gunicorn/eventlet process with long-lived sockets. Fly starts/stops machines and routes TLS traffic; PostgreSQL remains a separate persistent service. Multi-machine scale requires a shared Socket.IO broker and workflow isolation first. Backups, migration rollback and sustained load have not been established here.

## DOCX verification qualification

Content inspection caught and fixed two wrong template placeholders: VISION used color-blindness `rcb/lcb`; it now uses acuity `rev/lev`. Two maintained unittest cases verify independent acuity/color values and corrupt-photo fallback. The template change preserves individual run styles and surrounding layout. The packaged document renderer was attempted but failed because `soffice.exe` is unavailable in this Windows runtime. **Full page-image visual QA of the Word report remains blocked**; browser screenshots/GIF are visually checked, but do not describe the DOCX itself as fully visually verified. No clinical document fidelity certification is claimed.
