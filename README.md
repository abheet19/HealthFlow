> [!IMPORTANT]
> **Demonstration workspace only.** HealthFlow validates a configured clinic ID, user ID, and secret before its API or realtime channel can be used, then scopes stored rows, reports, and Socket.IO events to the authenticated clinic. It is for synthetic demonstration records only: do **not** enter real patient, school, employee, or health information. These configured credentials are not SSO, MFA, roles, consent, audit, retention, an encryption program, or a clinical compliance review.
<div align="center">

<br>

<img src="brand/mark.svg" alt="HealthFlow mark" width="112">

# 🩺 &nbsp;H E A L T H F L O W

### **One patient, five departments, one report.**

A clinic health-checkup workflow — IT intake, ENT, Vision, General and Dental — collected on<br>
five live dashboards and stitched into a single formatted `.docx` report.

<br>

![React](https://img.shields.io/badge/React-18-3ECF8E?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-1E9A66?style=for-the-badge&logo=typescript&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Python-5EE6A8?style=for-the-badge&logo=flask&logoColor=0A0D0B)
![Postgres](https://img.shields.io/badge/PostgreSQL-database-3ECF8E?style=for-the-badge&logo=postgresql&logoColor=white)
![CI](https://github.com/abheet19/HealthFlow/actions/workflows/ci.yml/badge.svg)
![Status](https://img.shields.io/badge/status-personal_project-8a94a6?style=for-the-badge)

<br>

<sub>A personal project by <b><a href="https://github.com/abheet19">Abheet</a></b>.</sub>

<br><br>

![HealthFlow demo](docs/demo/healthflow-demo.gif)

<sub>Two independent browser contexts, recorded against an isolated local PostgreSQL stack: IT registers a patient, the department<br>
tab picks them up over the WebSocket, all four departments report in, and the <code>.docx</code> falls out the end.</sub>

</div>

> [!NOTE]
> **Live service: [healthflow-abheet19.fly.dev](https://healthflow-abheet19.fly.dev).**
> Release status is established by matching the tested Git commit to both Fly releases and rerunning
> the public health/access smoke. The frontend publishes that commit at `/release.json`; the API
> publishes it in `/health`, so a mismatched two-service release fails verification. The local path
> below remains the supported synthetic demo setup.

---

## What this does

A clinic checkup normally means five departments filling out paper forms for the same patient and
someone reconciling all of it by hand afterwards. HealthFlow puts each department on its own
dashboard — IT registers the patient and takes their photo, ENT/Vision/General/Dental each fill in
their own exam fields — all reading and writing the clinic's current in-flight record over a
clinic-scoped WebSocket room, so authenticated tabs in that clinic stay in sync. Once every
department has submitted, IT's final submit
bundles all five sections into one call, the backend stores it in Postgres, and a formatted `.docx`
report is generated from a template and made available for download from the patients list.

---


```mermaid
flowchart LR
  IT[Intake tab] <-->|authenticated clinic-room events| S[Socket.IO relay]
  D[Four department tabs] <-->|field patches| S
  IT -->|final combined submission| F[Flask API]
  F --> P[(PostgreSQL)]
  P --> W[DOCX template renderer]
  W --> R[Downloadable report]
```

Draft changes synchronize before the final database commit. Different clinics are isolated, but
each clinic still has one shared active draft. See [testing and limitations](docs/TESTING.md) before
assuming simultaneous patient workflows, role authorization, or clinical readiness.

## 🛠 Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, MUI (Material UI), Socket.IO client |
| **Backend** | Python 3.12, Flask, Flask-SocketIO, SQLAlchemy, python-docx |
| **Database** | PostgreSQL |
| **Containerization** | Docker, Docker Compose (frontend + backend + PostgreSQL 17) |
| **Operations** | Fly.io, GitHub Actions CI, database-aware health check, request IDs and Server-Timing |

---

## 🎨 Design

Dark glass throughout, with its own accent family rather than a generic dashboard blue: a
**clinical emerald/mint gradient** (`#5EE6A8 → #3ECF8E → #1E9A66`) over a near-black ground
(`#0A0D0B`), with soft mint-tinted glass panels and `#E6F5EE` body text. One green hue carried
across three depths — light highlight, mid accent, deep forest edge — rather than a second hue
bolted on, so the five dashboards read as one clinical instrument instead of five separate forms.

A shared `DashboardShell` component carries that look consistently across all five department
pages: the same glass card, the same "waiting for a patient ID" empty state, the same patient
header, so a style change only has to happen in one place.

---

## 🖼 Screenshots

Captured from the current application with synthetic records on an isolated local PostgreSQL stack.

| IT dashboard (patient intake) | Dental dashboard (shared-workflow waiting state) |
|---|---|
| ![IT dashboard](docs/screenshots/it-dashboard.png) | ![Dental dashboard waiting for a workflow](docs/screenshots/dental-dashboard.png) |

![Patients list](docs/screenshots/patients-list.png)

<details>
<summary>Mobile navigation (390 px verified viewport)</summary>

![Mobile navigation drawer](docs/screenshots/mobile-navigation.png)

</details>

---

## Key features

- **Clinic-scoped real-time sync** — authenticated Socket.IO clients join server-derived clinic and
  user rooms; department events reach peers in the same clinic and cannot select another room.
- **Five department dashboards** — IT, ENT, Vision, General and Dental, each with its own required
  fields and validation, sharing one patient context.
- **Automated `.docx` report generation** — once a patient's record is complete, a formatted Word
  report is generated from a template and downloadable from the patients list.
- **Consistent feedback UX** — loading states while data is fetched, empty-state messaging when a
  department has no patients yet, and success/error toasts surfaced consistently across all five
  dashboards.
- **Bounded browser payload** — department pages are loaded as route chunks, so opening one station
  does not download every other form up front.
- **Operational signals without patient payloads** — API responses carry a correlation ID and
  `Server-Timing`; logs record only method, path, status and duration. `/health` checks PostgreSQL
  before reporting ready.
- **Keyboard and phone-width access** — a skip link, named controls, exposed toggle state, one main
  landmark and page heading per route, and every navigation destination are automatically checked at 320 px.

---

## 🚀 Running it locally

**With Docker (recommended — brings up Postgres too):**

```bash
git clone https://github.com/abheet19/HealthFlow.git
cd HealthFlow
cp .env.example .env
docker compose up --build
```

Open `http://127.0.0.1:3000` and use clinic `demo`, user `demo-user`, and the
local synthetic code `synthetic-local-test`. Override `HEALTHFLOW_DB_PASSWORD`,
the default identity, and `HEALTHFLOW_ACCESS_CODE` in an untracked `.env`, or
configure an exact `HEALTHFLOW_IDENTITIES_JSON` clinic/user map. Never reuse
deployment secrets or real records in this demo stack.

Follow [the usage guide](docs/USAGE.md) for the department sequence, keyboard/mobile controls, and
failure recovery. To enable the repository's dependency-free pre-commit gate in a clone, run
`git config core.hooksPath .githooks` once after installing the pinned frontend/backend dependencies.

**Without Docker:**

```bash
# Backend
cd backend
pip install -r requirements.txt
# .env with POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_HOST / POSTGRES_PORT / POSTGRES_DB
python init_db.py
# Set either HEALTHFLOW_ACCESS_CODE + the default clinic/user, or
# HEALTHFLOW_IDENTITIES_JSON, plus CORS_ORIGINS for your local frontend
python server.py

# Frontend, in a second terminal
cd frontend
npm ci
# Set VITE_API_URL and VITE_SOCKET_URL to your local backend
npm run dev
```

---

## Project layout

```
HealthFlow/
├── .github/    Source checks and full synthetic Docker acceptance in CI
├── backend/     Flask API, Socket.IO server, docx report generation
├── frontend/    React + TypeScript + Vite + Tailwind + MUI
├── tools/       Demo recorder (not part of the app build)
└── docker-compose.yml
```

---

## 🎬 Regenerating the demo GIF

The GIF at the top is a Playwright script driving two independent browser
contexts against an isolated local stack, so the right-hand pane only ever changes because something
actually arrived over the WebSocket. Re-record it whenever the UI changes:

```bash
cd tools
npm install
npx playwright install chromium
BASE_URL=http://127.0.0.1:3000 API_URL=http://127.0.0.1:5000 node record-demo.mjs
python build-gif.py # composites the panes -> docs/demo/healthflow-demo.gif
BASE_URL=http://127.0.0.1:3000 npm run verify
```

`record-demo.mjs` should run against a local stack and registers a synthetic patient named
**Demo Patient** and runs the full five-department flow. `build-gif.py` takes `--width`, `--colors`
and `--tempo` if you need to trade size against length. The scripts use local Chrome on Windows,
Playwright Chromium in Linux CI, or the browser at `CHROME_PATH` when set.

> The recorder rejects remote frontend URLs. Use a disposable local database and never record against deployed patient records.

The latest measured checks, exact commands, deployment model and known limits
are in [the testing artifact](docs/TESTING.md). The current production build keeps the locked gate at
149.91 kB (48.51 kB gzip), then loads the authenticated workspace as a 242.38 kB route chunk
(79.81 kB gzip) and the selected department on demand. Pinned Lighthouse 13 lab runs against that
build scored 100 for Performance, Accessibility, Best Practices, and SEO on mobile and desktop;
automated accessibility does not constitute independent WCAG certification. Production npm audits and the
patched backend requirements audit reported zero known runtime dependency vulnerabilities; the full
frontend build/lint toolchain still has eight advisories tracked in the testing artifact.
