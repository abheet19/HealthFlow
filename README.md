<div align="center">

<br>

# 🩺 &nbsp;H E A L T H F L O W

### **One patient, five departments, one report.**

A clinic health-checkup workflow — IT intake, ENT, Vision, General and Dental — collected on<br>
five live dashboards and stitched into a single formatted `.docx` report.

<br>

![React](https://img.shields.io/badge/React-18-3ECF8E?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-1E9A66?style=for-the-badge&logo=typescript&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Python-5EE6A8?style=for-the-badge&logo=flask&logoColor=0A0D0B)
![Postgres](https://img.shields.io/badge/PostgreSQL-database-3ECF8E?style=for-the-badge&logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/status-personal_project-8a94a6?style=for-the-badge)

<br>

<sub>A personal project by <b><a href="https://github.com/abheet19">Abheet</a></b>.</sub>

<br><br>

![HealthFlow demo](docs/demo/healthflow-demo.gif)

<sub>Two browser tabs, recorded against the live deployment: IT registers a patient, the department<br>
tab picks them up over the WebSocket, all four departments report in, and the <code>.docx</code> falls out the end.</sub>

</div>

> [!NOTE]
> **Live at [healthflow-abheet19.fly.dev](https://healthflow-abheet19.fly.dev).** Frontend, backend
> and Postgres are all deployed on Fly.io — see [Running it locally](#-running-it-locally) if you'd
> rather run it yourself.

---

## What this does

A clinic checkup normally means five departments filling out paper forms for the same patient and
someone reconciling all of it by hand afterwards. HealthFlow puts each department on its own
dashboard — IT registers the patient and takes their photo, ENT/Vision/General/Dental each fill in
their own exam fields — all reading and writing the same in-flight patient record over a WebSocket,
so every tab stays in sync as data comes in. Once every department has submitted, IT's final submit
bundles all five sections into one call, the backend stores it in Postgres, and a formatted `.docx`
report is generated from a template and made available for download from the patients list.

---

## 🛠 Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, MUI (Material UI), Socket.IO client |
| **Backend** | Python, Flask, Flask-SocketIO, SQLAlchemy, python-docx |
| **Database** | PostgreSQL |
| **Containerization** | Docker, docker-compose (frontend + backend + Postgres) |

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

Captured live from [the deployed app](https://healthflow-abheet19.fly.dev), running against the real
Fly Postgres backend.

| IT dashboard (patient intake) | Dental dashboard (Socket.IO connecting state) |
|---|---|
| ![IT dashboard](docs/screenshots/it-dashboard.png) | ![Dental dashboard connecting to the realtime server](docs/screenshots/dental-dashboard.png) |

![Patients list](docs/screenshots/patients-list.png)

---

## Key features

- **Real-time sync across dashboards** — a Socket.IO connection keeps every department's view of a
  patient record current as other departments submit data.
- **Five department dashboards** — IT, ENT, Vision, General and Dental, each with its own required
  fields and validation, sharing one patient context.
- **Automated `.docx` report generation** — once a patient's record is complete, a formatted Word
  report is generated from a template and downloadable from the patients list.
- **Consistent feedback UX** — loading states while data is fetched, empty-state messaging when a
  department has no patients yet, and success/error toasts surfaced consistently across all five
  dashboards.

---

## 🚀 Running it locally

**With Docker (recommended — brings up Postgres too):**

```bash
git clone https://github.com/abheet19/HealthFlow.git
cd HealthFlow
docker-compose up --build
```

**Without Docker:**

```bash
# Backend
cd backend
pip install -r requirements.txt
# .env with POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_HOST / POSTGRES_PORT / POSTGRES_DB
python init_db.py
python server.py

# Frontend, in a second terminal
cd frontend
npm ci
npm run dev
```

---

## Project layout

```
HealthFlow/
├── backend/     Flask API, Socket.IO server, docx report generation
├── frontend/    React + TypeScript + Vite + Tailwind + MUI
├── tools/       Demo recorder (not part of the app build)
└── docker-compose.yml
```

---

## 🎬 Regenerating the demo GIF

The GIF at the top isn't a mockup — it's a Playwright script driving two independent browser
contexts against the deployed app, so the right-hand pane only ever changes because something
actually arrived over the WebSocket. Re-record it whenever the UI changes:

```bash
cd tools
npm install
npx playwright install chromium
node record-demo.mjs      # drives the live app, writes frame pairs to tools/.frames/
python build-gif.py       # composites the panes -> docs/demo/healthflow-demo.gif
```

`record-demo.mjs` wakes the Fly machines first (they scale to zero), then registers a patient named
**Demo Patient** and runs the full five-department flow. `build-gif.py` takes `--width`, `--colors`
and `--tempo` if you need to trade size against length. Point the recorder at a local stack with
`BASE_URL=http://localhost:5173 node record-demo.mjs` to keep the demo out of the deployed database
entirely.

> [!WARNING]
> Run against the deployment, the recording writes a real patient row to the production Postgres,
> and there is no delete endpoint. Clean it up afterwards from the backend machine:
>
> ```bash
> fly ssh console -a healthflow-api-abheet19
> # then, in the machine:
> python
> >>> from app.config import get_db
> >>> from sqlalchemy import text
> >>> db = get_db()
> >>> db.execute(text("DELETE FROM patient_records WHERE name = 'Demo Patient'"))
> >>> db.commit()
> ```

<sub>Further backend details (endpoints, environment variables, deployment) live in
<code>backend/</code>'s own comments and configuration.</sub>
