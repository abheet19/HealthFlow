# HealthFlow — sanity, acceptance, and release guide

> Snapshot: 10 September 2026 IST. Run this against disposable or synthetic data. Save the branch, commit, complete dirty-path list, command, exit code, environment, and artifact hashes with every result.

## Before running

Use the repository's disposable Docker Compose database and generated synthetic IDs only. Never record against the public app or enter real health data. Ensure all test clinic/user secrets are separate from any live secret.

```powershell
Set-Location '.\frontend'
npm ci --legacy-peer-deps
npm run lint
npm run build
Set-Location '..\backend'
python -m pip install -r requirements.txt
python -m pip check
python -m unittest discover -s tests
Set-Location '..'
docker compose up --build -d
Set-Location '.\tools'
npm ci
npm run verify
```

Set `HEALTHFLOW_REVISION` to `git rev-parse HEAD` before the Compose build when collecting release
evidence. Enable the versioned local gate once with `git config core.hooksPath .githooks`.

## Product sanity checklist

- [ ] Gate rejects incomplete/wrong clinic credentials; HTTP and Socket.IO refuse mismatched clients; lock clears clinic/user/secret/draft state.
- [ ] Two same-clinic contexts share one synthetic ID through real Socket.IO; rapid edits and reset behave deterministically.
- [ ] A three-client probe delivers a draft event to a same-clinic peer and never to another clinic; event payloads cannot select rooms.
- [ ] Patient list/report access is bound to the authenticated clinic; a cross-clinic report lookup returns 404.
- [ ] All five departments, conditional fields, N/A states, BMI, teeth, image states, and validation errors work.
- [ ] IT final submit creates one row; Patients search/reload/empty state and DOCX download/content pass.
- [ ] Every desktop/mobile navigation and unknown-route CTA works; 320 px pages have one main
  landmark, one page heading, named controls, a 24 px target floor, and no document-level horizontal overflow.
- [ ] Access, list, report, and realtime failure states recover through their visible retry path.
- [ ] Database stop yields bounded degraded health; restart recovers; migrations and rollback are rehearsed on a copy.

## Retained evidence for the current candidate

- Exact CI stack: five departments, 62 frame pairs, 14 workflow + 17 navigation + 12 resilience/accessibility checks, one synthetic row, and an inspected DOCX.
- Backend: 11/11 tests; live Socket.IO sender/same-clinic/other-clinic delivery counts `0/1/0`; each clinic listed only its own synthetic row and cross-clinic report returned 404.
- `docs/TESTING.md`, `docs/verification/`, and the backend regressions retain repository evidence; regenerate `public-smoke-results.json` for each release.

## Release sequence

1. Review local commits/diff and freeze one commit.
2. Rerun frontend/backend/Compose recorder-verifier with synthetic data.
3. Rehearse schema migration, backup, restore, and rollback before touching persistent data.
4. Deploy API first, verify DB health, then frontend; require API `/health` and frontend
   `/release.json` to expose the same tested SHA and run `verify:public`.

## Claims this guide does not establish

- No clinical/compliance claim, SSO/MFA/RBAC, same-clinic patient-workflow isolation, multi-machine Socket.IO, offline conflict handling, or restore proof.
- The public smoke does not run patient workflows. Complete patient workflows remain synthetic
  local/CI evidence only. Automated accessibility checks do not establish independent WCAG
  certification.

A green local run is evidence for the exact tested tree. Call a feature deployed only after recording `source commit -> CI run -> image/release -> post-deploy smoke` for the same bytes.
