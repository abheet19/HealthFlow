# HealthFlow — current implementation context

> Evidence snapshot: 11 September 2026 IST. Release evidence must map one exact Git commit through GitHub CI, both Fly releases, and post-deploy smoke.
>
> This is the short, AI-readable map. Current source and executable tests win if an older design note disagrees. A dirty working tree is a candidate, not a release; a configured URL is not proof that the candidate is deployed.

## Product contract

HealthFlow is a synthetic demonstration of one health-camp workflow per clinic. IT intake, ENT, Vision, General, and Dental edit a shared browser-session draft; IT submits the combined record to PostgreSQL; Patients can search and download a DOCX report. Configured clinic/user/secret triples authenticate requests and derive server-owned clinic and user rooms. Stored patient rows and reports are filtered by clinic. It is not an EHR, clinical decision system, role-authorized platform, or compliance-ready product, and it must never receive real patient or sensitive data.

## Architecture and end-to-end flow

```text
access gate -> React/TypeScript/Vite workspace -> shared PatientProvider
  -> Fetch for validation/persistence/reporting
  -> Socket.IO for in-session draft broadcasts
  -> Flask/Flask-SocketIO + SQLAlchemy/Psycopg
  -> PostgreSQL final row -> docxtpl/python-docx report
```

The locked shell is small; the authenticated workspace and each department load lazily. HTTP headers and the Socket.IO handshake carry the same clinic ID, user ID, and secret. The server authenticates the exact configured triple, derives room names itself, and routes draft events only to that clinic. Department saves update the shared in-memory/browser-session draft; only final IT submission creates a database record tagged with the authenticated clinic. Docker Compose is the exact local three-service topology. The frontend and backend deploy as separate Fly apps and must be mapped to one source commit.

## Code map

| Path | Responsibility |
| --- | --- |
| `frontend/src` | access gate, routing/lazy boundaries, PatientProvider, department forms, socket/fetch clients, and report/list UI |
| `backend/server.py; backend/app/access.py; backend/app/realtime.py` | Flask/Socket.IO entry, exact credential registry, server-derived rooms, health, and request boundaries |
| `backend/init_db.py; backend/app/routes.py; backend/app/services` | schema, transaction/persistence, report assembly, and HTTP contracts |
| `backend/template.docx` | DOCX report template |
| `tools` | synthetic recorder, browser verifier, socket probe, evidence checks, and media generation |
| `docker-compose.yml; frontend/Dockerfile; backend/Dockerfile` | reproducible local production-shaped topology |
| `frontend/fly.toml; backend/fly.toml` | separate hosted services |
| `docs/USAGE.md; docs/TESTING.md; .github/workflows/ci.yml` | product usage, canonical acceptance, and automated gate |

## Invariants and trust boundaries

- Use synthetic records only; keep the demonstration/non-clinical disclaimer beside access and workflow surfaces.
- HTTP and Socket.IO must authenticate the same exact clinic/user/secret triple; event payloads must never select their own rooms; logs must not contain secrets, record payloads, or exception text that can embed them.
- Draft broadcasts are not database commits. Only final IT submit persists the complete row transactionally.
- Schema, forms, mapping, validation, report template, report service, and DOCX assertions change together.
- Lock clears this tab's clinic ID, user ID, secret, and draft. Configured identities do not provide SSO, MFA, roles, consent, audit, revocation, retention, or patient-level ownership.
- Clinic rooms prevent cross-clinic event delivery. One clinic still has one active draft, so do not claim simultaneous patient workflows until workflow ownership, durable state, revisions, and reconnect behavior are implemented and tested.

## User workflows to preserve

- Reject incomplete/wrong clinic credentials; unlock with a configured demo identity; lock and verify all tab credentials and draft state are cleared.
- Create a synthetic ID in IT and verify real Socket.IO delivery to an independent browser context in the same clinic, plus non-delivery to another clinic.
- Complete IT, ENT, Vision, General, and Dental fields including conditional descriptions, N/A switches, BMI, teeth, and synthetic image add/show/delete.
- Verify incomplete-form errors, rapid edit retention, clinic-scoped reset, clinic-filtered persistence/list/report access, Patients search/empty/reload, and DOCX download/content.
- Use the keyboard skip link, mobile drawer, and every navigation CTA at 320 px without page-level overflow.
- Exercise access/list/report failure and recovery, socket disconnect/reconnect, named controls, pressed state, main landmarks, page headings, and minimum target sizes.
- Stop/restart the disposable database and verify bounded degraded `/health` then recovery.

## Concepts this project teaches

| Concept | How it appears here |
| --- | --- |
| SPA code splitting | access shell, workspace, and departments load in separate Vite chunks |
| Shared client state | PatientProvider coordinates a multi-step draft across routes |
| HTTP versus WebSocket | HTTP validates/persists; Socket.IO broadcasts low-latency draft changes |
| Tenant boundary | exact configured credentials derive clinic/user rooms; queries bind the authenticated clinic rather than trusting payload scope |
| Transactions and relational mapping | final submit maps one coherent draft to a PostgreSQL row |
| Document generation | structured data fills a DOCX template with content assertions |
| Stateful deployment | frontend/API/database mappings, migrations, backup/restore, and rollback require coordination |

## CI, packaging, deployment, and rollback

The release gate checks whitespace, builds/lints the Vite frontend, checks Python dependencies and 11 backend tests, starts PostgreSQL/API/frontend through Compose, proves both containers identify the GitHub SHA, records and verifies the complete synthetic workflow, tests 320 px routes and recoverable failures, stops/restarts PostgreSQL, then stops the stack. CI runs that source and Docker workflow; no continuous deployment is configured. Runtime secrets are `DATABASE_URL` plus either the legacy local-demo `HEALTHFLOW_ACCESS_CODE` and fixed default identity, or the multi-identity `HEALTHFLOW_IDENTITIES_JSON` map.

Deploy the backend first, verify database-aware health and schema initialization, then deploy the frontend with matching API/socket URLs. Backend `/health` and frontend `/release.json` must expose the same expected Git SHA. Rehearse migration, backup, restore, and rollback on a database copy; retain the previous images plus restore instructions.

## Current measured evidence

| Result | Evidence |
| --- | --- |
| Exact Compose contract: all five departments, 62 frame pairs, a fresh synthetic row, DOCX content, 14 workflow + 17 navigation + 12 resilience/accessibility checks | `docs/TESTING.md`, CI artifact, and `docs/verification/*.json` |
| Three live Socket.IO clients: same-clinic peer received one event; sender and other clinic received zero | `backend/tests/test_access_and_realtime.py` and release evidence |
| Persisted boundary: each clinic listed only its own synthetic row; cross-clinic report request returned 404 | `backend/tests/test_patient_scope.py` and release evidence |
| Backend regressions: 11/11, including exact credentials, clinic/user rooms, invalid event rejection, scoped list/report SQL, and DOCX behavior; patched pinned requirements report zero known vulnerabilities under `pip-audit` | `backend/tests`, `backend/requirements.txt`, and per-release audit JSON |
| Public boundary: gate, safe access failure/recovery, matched frontend/API SHA, database health, 12-request bounded probe, 320 px/CLS | `tools/verify-public.mjs` and per-release `public-smoke-results.json` |
| Current production-build Lighthouse: mobile/desktop 100 Performance, Accessibility, Best Practices, and SEO; mobile FCP/LCP 1.1 s, TBT 0 ms, CLS 0 | `docs/verification/lighthouse-mobile.json` and `docs/verification/lighthouse-desktop.json` |

The evidence above belongs to its dated run and exact source. It becomes live evidence only after the same commit passes CI, maps to both releases, and passes post-deploy smoke.

## Open limits

- Configured clinic/user credentials are not SSO/MFA/RBAC/consent/audit/revocation/retention/compliance. Use no real personal or health data.
- Cross-clinic realtime and stored-row access are scoped. A clinic still shares one active draft; there are no workflow/patient rooms, durable draft log, offline replay, ownership checks, or conflict resolution.
- Single-worker Eventlet/Socket.IO topology has no shared broker or demonstrated horizontal behavior; Eventlet migration remains due.
- The idempotent initializer adds `clinic_id` and maps pre-existing rows to `demo`; it is not a migration framework. No tested production data mapping, backup/restore, or disaster-recovery flow exists; local outage recovery is not failover.
- DOCX evidence checks package structure/content, not full Office/LibreOffice pagination or cross-suite rendering.
- Automated accessibility checks cover detectable WCAG failures, keyboard entry, names, pressed state, target floor, landmarks, and 320 px overflow. They are not independent WCAG certification or a complete assistive-technology/browser matrix.

## Reading order

1. `CONTEXT.md` and `MEMORY.md` — current contract, decisions, evidence, and limits
2. `docs/USAGE.md` — safe end-to-end product flow and recovery
3. `D:\Work\HealthFlow Study Pack\02_HealthFlow_Concepts_From_Zero.md` — HTTP, sockets, React, Flask, SQL, and DOCX foundations
4. `D:\Work\HealthFlow Study Pack\05_HealthFlow_System_Design_React_TypeScript_Flask_Walkthrough.md` — end-to-end code path
5. `frontend/src; backend` — actual client/server implementation
6. `docker-compose.yml; frontend/backend Fly configs; CI` — delivery topology
7. `docs/SANITY.md; docs/TESTING.md; D:\Work\HealthFlow Study Pack\08_TESTING_ARTIFACT.md` — acceptance and evidence

Use `docs/SANITY.md` in the repository, or `09_SANITY_CHECK.md` in the Study Pack, before claiming that a new change works.

## Rules for the next coding agent

1. Keep all demos synthetic and disclaim clinical/compliance use.
2. Preserve exact HTTP/socket credential checks, server-derived clinic/user rooms, clinic-bound queries, and payload-free logs.
3. Treat workflow rooms, ownership, durable drafts, revisions, and reconnect behavior as required before any same-clinic concurrent-visit claim.
4. Change schema/forms/mapping/report/tests atomically and test rollback-safe transactions.
5. Map frontend, API, database migration, source, and rollback separately; do not deploy without authorization.
