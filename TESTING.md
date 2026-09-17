# ThreatSea – Test Documentation

> **Audience:** New testers joining the project, or contributors who need to understand the test setup end-to-end.
> **Scope:** Frontend component tests (Vitest) and end-to-end tests (Playwright) for [ThreatSea](https://github.com/MaibornWolff/ThreatSea), the threat-modeling tool by MaibornWolff.

**Last updated:** 2026-09-04
**Owners:** Katharina (FE Component Tests) · Yassine (Playwright / E2E / CI)

---

## Table of Contents

1. [Testing Concept](#1-testing-concept)
2. [Roles & Responsibilities](#2-roles--responsibilities)
3. [Frontend Component Tests (Vitest)](#3-frontend-component-tests-vitest)
4. [Playwright E2E Tests](#4-playwright-e2e-tests)
   - 4.1 [Architecture](#41-architecture)
   - 4.2 [Folder Layout](#42-folder-layout)
   - 4.3 [Naming Conventions](#43-naming-conventions)
   - 4.4 [Running Tests Locally](#44-running-tests-locally)
   - 4.5 [Role-Based / Multi-Identity Testing](#45-role-based--multi-identity-testing)
5. [Guidelines for New Testers](#5-guidelines-for-new-testers)
6. [CI/CD Integration](#6-cicd-integration)
7. [Stability & Maintenance](#7-stability--maintenance)
8. [Quick Start (Day 1)](#8-quick-start-day-1)
9. [Glossary](#9-glossary)

---

## 1. Testing Concept

```
                      ┌───────────────────────────────┐
                      │  E2E (Playwright, 140 tests)  │  ← Yassine
                      │  apps/frontend/playwright/    │
                      └───────────────────────────────┘
                                  ▲
                ┌──────────────────────────────────────┐
                │  Frontend Component Tests (Vitest)   │  ← Katharina
                │  apps/frontend/src/**/*.{test,spec}.{ts,tsx} │
                └──────────────────────────────────────┘
                                  ▲
                ┌──────────────────────────────────────┐
                │  Backend Unit/Integration (Vitest)   │  (out of scope here)
                └──────────────────────────────────────┘
```

Component tests run on every commit and follow a co-location convention (test files live next to
what they cover). E2E runs locally today (see [section 6](#6-cicd-integration) for why it's not in
CI yet) and follows the Page Object Model conventions below to stay maintainable and handover-ready.

**Project-wide testing rules** (from `AGENTS.md`):

- **Vitest globals are enabled** — do not import `describe`, `it`, `expect`, `vi`, etc.
- **Test behavior, not implementation** — a refactor that preserves behavior must not break a test.
- **Meaningful assertions** — "does not throw" alone is not enough.
- **Cover edge cases** — empty input, null/undefined, errors, boundary values.

---

## 2. Roles & Responsibilities

| Area                           | Owner     | Backup                             |
| ------------------------------ | --------- | ---------------------------------- |
| Component tests (Vitest)       | Katharina | Yassine                            |
| Playwright (POM, CI, fixtures) | Yassine   | Katharina                          |
| This document                  | Yassine   | anyone who changes the test system |

Both review each other's test changes when out of office, and both keep this document up to date
— any change to the test system should be reflected here.

---

## 3. Frontend Component Tests (Vitest)

Tests are a **project convention**: they live next to the component they cover
(`button.component.tsx` → `button.component.test.tsx`). Vitest discovers files via
`include: ["src/**/*.{test,spec}.{ts,tsx}"]` in `vitest.config.ts` (`.test.ts`, `.test.tsx`,
`.spec.ts`, `.spec.tsx`). Use `@testing-library/react` + `@testing-library/user-event`; prefer
accessible queries (`getByRole`, `getByLabelText`) over `getByTestId`. `describe`/`it`/`expect`/
`vi` are Vitest globals — never imported. Testing a `disabled` MUI control needs
`userEvent.click(el, { pointerEventsCheck: 0 })`, since MUI disables pointer-events via CSS.

```bash
pnpm --filter threatsea_fe test:unit:watch   # while iterating
pnpm --filter threatsea_fe test:unit         # single run
pnpm --filter threatsea_fe test:unit:coverage  # + coverage/index.html
```

Reports land in `apps/frontend/coverage/` and `apps/frontend/junit.xml`.

---

## 4. Playwright E2E Tests

### 4.1 Architecture

E2E tests run a real browser against the full stack (frontend + backend + Postgres) and follow
the **Page Object Model**: `tests/` describe behavior only (no selectors, no hard waits) →
`pages/` (one class per route extending `BasePage`, owns all `Locator`s and page-level actions) →
`utils/` (typed API clients for fast setup/teardown) → `builder/`/`fixtures/`/`enums/` (payload
factories, JSON test data, shared enums).

Key patterns:

- **Per-test isolation.** Every test namespaces its resources with `buildTestId(browserName,
testId)` so parallel runs and reruns don't collide.
- **API-driven setup/teardown.** `beforeEach` seeds via API, `afterEach` deletes what the test
  created — tests stay independent.
- **Auth once per browser.** `auth.setup.ts` logs in once per browser and stores the session in
  `tmp/.auth/<browser>-user.json`; every test reuses it.
- **UI only for the behavior under test.** Seed 10 projects via API to test sorting; don't click
  through 10 modals to set that up.

### 4.2 Folder Layout

```
apps/frontend/playwright/
├── auth.setup.ts       # Per-browser login → tmp/.auth/<browser>-user.json
├── pages/               # 12 Page Objects (base.page.ts + one per route)
├── tests/               # 13 spec files, 140 tests total, e.g.:
│   ├── projects.page.e2e.spec.ts   # 7 tests
│   ├── editor.page.e2e.spec.ts     # 32 tests (some parameterized, e.g. per icon)
│   ├── members.page.e2e.spec.ts    # 23 tests (most run once for projects, once for catalogs)
│   └── risk.page.e2e.spec.ts       # 11 tests (2 quarantined, see 7.1)
├── fixtures/            # JSON test data
├── builder/             # test-data.builder.ts — buildTestId, buildProject, ...
├── enums/               # shared test enums
└── utils/               # api.utils.ts (fetchApi/fetchApiRaw) + one <resource>.api.ts per domain
```

Re-check exact counts with `pnpm --filter threatsea_fe playwright --list` before trusting them
for long — this table drifts the moment someone adds a test and forgets to come back here.

### 4.3 Naming Conventions

| Element             | Convention                                     | Example                                          |
| ------------------- | ---------------------------------------------- | ------------------------------------------------ |
| Spec / page object  | `<route>.page.e2e.spec.ts` / `<route>.page.ts` | `projects.page.e2e.spec.ts` / `projects.page.ts` |
| Page object class   | `PascalCase` + `Page`                          | `ProjectsPage`                                   |
| API helper file     | `<resource>.api.ts`                            | `project.api.ts`                                 |
| `data-testid` value | `<page>_<feature>_<element>`                   | `project-creation-modal_name-input`              |
| Test title          | `"Should <observable behavior>"`               | `"Should create new projects"`                   |
| Test resource name  | always include `buildTestId(...)`              | `` `${project.name}-${tid}` ``                   |

### 4.4 Running Tests Locally

```bash
# Prerequisites (separate terminals): docker compose up -d postgres; pnpm dev --filter=threatsea_be
pnpm --filter threatsea_fe playwright:init   # install browsers, once per machine
pnpm --filter threatsea_fe playwright        # headless, Chromium, 1 worker (local baseline; candidate CI shape)
pnpm --filter threatsea_fe playwright:ui     # interactive UI mode, recommended for debugging
```

On failure: HTML report in `apps/frontend/playwright-report/`, traces/screenshots/video in
`apps/frontend/test-results/`.

### 4.5 Role-Based / Multi-Identity Testing

Needed whenever a test verifies what a **different role** (Editor, Viewer) may do, in addition to
the primary Owner identity `auth.setup.ts` logs in per browser. Pattern (`utils/auth.api.ts`):
`provisionFixedTestUser(testUserIndex)` creates/logs in one of the backend's fixed E2E profiles
(indices `0`–`1`, reserved — `2`/`3`/`4` are the browsers' own primary identities) via an isolated
request context, just so it exists to be added as a member; add it with the role under test; then
`loginAsFixedTestUser(page, testUserIndex)` swaps **`page`'s** identity mid-test.

**Gotcha (already caused a false result in one of our own tests):** this only changes `page`'s
cookies. The `request` fixture has its own independent cookie jar seeded from `storageState` and
keeps acting as the original Owner even after the swap — a raw API call made with the bare
`request` fixture is silently still the Owner. Use `page.request` for API calls that must run as
the swapped-in identity (see `members.page.e2e.spec.ts`'s privilege-escalation test).

---

## 5. Guidelines for New Testers

**New E2E test:** find or create the page object (`<route>.page.ts` extends `BasePage`) → add any
missing `data-testid`s (with EN+DE translations) → add `Locator`s to the page object → add an API
helper if you need to seed/clean data → write `tests/<route>.page.e2e.spec.ts` with
`beforeEach`/`afterEach` isolation and `buildTestId(...)`-namespaced resources → run with
`playwright:ui` until green → open a PR (reviewer: Yassine).

**New component test:** place it next to the component, use Testing Library + `userEvent`, test
observable behavior (not internals) with at least one edge case → run
`test:unit:watch` → open a PR (reviewer: Katharina).

**Debugging a failing E2E test:** `playwright show-report` → open the failing test's **trace**
(screenshots, DOM snapshots, console/network logs) → `playwright:ui` to step through → `--headed
--debug` to watch it live → check the obvious environment causes (backend/Postgres running,
`.env.test` changed).

**Avoid:** hard waits (`page.waitForTimeout`), raw selectors in specs, shared mutable state
between tests, asserting on internals instead of user-visible behavior, and `test.only` in
committed code (`forbidOnly: true` fails CI).

---

## 6. CI/CD Integration

`.github/workflows/ci.yml` runs lint, backend, and frontend build/test (Vitest) on every PR and
push to `main`/`next`/`v*.*.x`. **Playwright is not wired in** — the E2E suite is local-only.
Not currently planned; if that changes, mirror `test-backend`'s Postgres service, set
`AUTH_METHOD=fixed`, install Chromium, start the backend, run
`pnpm --filter threatsea_fe playwright`, and upload the report/traces as artifacts.

---

## 7. Stability & Maintenance

**Flake prevention:** `data-testid` locators, auto-waiting/`expect(...).toBeVisible()` (never
`waitForTimeout`), one test = one behavior, `buildTestId(...)`-namespaced resources, always clean
up in `afterEach`.

### 7.1 When a test becomes flaky

Quarantine immediately (`test.fixme(...)` + a comment explaining why) → open an issue → find the
root cause, never just add retries → fix and unquarantine (sprint review checks remaining
`fixme`s).

A consistently-failing automated test is evidence to investigate, not proof of a bug by itself.
Two `risk.page.e2e.spec.ts` cases made that concrete: one failure turned out to be a real
frontend/backend permission mismatch (reported); an outwardly identical one turned out to only
happen under React's `<StrictMode>` combined with Playwright's automation timing — never
reproducible manually, and confirmed as no real bug once `<StrictMode>` was removed and the test
passed. Cross-check with a manual repro before reporting anything.

### 7.2 Cadence & targets

Per PR: new/changed tests alongside the feature. Weekly: review CI failure trends. Per sprint:
triage `test.fixme` items. Per quarter: Page Object refactor pass. Targets: E2E suite < 15 min on
CI, component suite < 3 min (shard with `--shard=1/N` if the E2E suite outgrows that).

---

## 8. Quick Start (Day 1)

From a fresh clone to a running test suite. 8.1, 8.2 and 8.4 are one-time setup; 8.3 and 8.5 are
what you run day to day.

### 8.1 Clone and install

```bash
git clone git@github.com:MaibornWolff/ThreatSea.git && cd ThreatSea
pnpm install
```

### 8.2 Create the backend `.env`

`apps/backend/.env` is gitignored and has to be created once. It is not optional: `pnpm dev` runs
the backend as `tsx --env-file .env`, so without the file Node aborts before the first line of
application code.

The values below mirror the `threatsea` service in `docker-compose.yaml`:

```bash
cat > apps/backend/.env <<'EOF'
JWT_SECRET=somerandomstringtobeusedasJWTsecret
EXPRESS_SESSION_SECRET=someRandomExpressSessionSecret
AUTH_METHOD=fixed
ORIGIN_APP=http://localhost:3000
ORIGIN_BACKEND=http://localhost:8000
DATABASE_HOST=127.0.0.1
DATABASE_USER=threatsea
DATABASE_PASSWORD=threatseapassword
DATABASE_NAME=threatsea
DATABASE_TLS=disabled
COOKIES_SECURE_OPTION=disabled
EOF
```

`AUTH_METHOD=fixed` is not optional for E2E — `auth.setup.ts` logs in via
`/api/auth/login?testUser=<n>`, a route that only exists in fixed-auth mode. The same fixed
profiles back the role-based tests in [section 4.5](#45-role-based--multi-identity-testing).

### 8.3 Start database and backend

```bash
docker compose up -d postgres
pnpm dev --filter=threatsea_be
```

Give the backend its own terminal and leave it running. It applies pending Drizzle migrations on
startup, before it binds port 8000 — there is no separate migration step.

### 8.4 Install the Playwright browsers

Once per machine:

```bash
pnpm --filter threatsea_fe playwright:init
```

### 8.5 Run the tests

```bash
pnpm --filter threatsea_fe test:unit:watch   # Vitest component tests, watch mode
pnpm --filter threatsea_fe playwright:ui     # Playwright UI mode
```

The frontend dev server is not in this list on purpose: Playwright starts it and reuses a running
one locally (`webServer.reuseExistingServer` in `playwright.config.ts`).

---

## 9. Glossary

| Term               | Meaning                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **POM**            | Page Object Model — encapsulates a page's selectors and actions into a class                           |
| **`data-testid`**  | HTML attribute used as a stable selector hook for tests                                                |
| **`buildTestId`**  | Combines `browserName` + Playwright's per-test `testId` into a unique resource namespace               |
| **Storage state**  | Playwright's mechanism for persisting cookies + localStorage between tests (skips the login flow)      |
| **CSRF token**     | Anti-forgery token in `localStorage` after login; read via `getCsrfToken()`                            |
| **Trace**          | Playwright artifact (`*.zip`) with screenshots, DOM snapshots, network/console logs for one test run   |
| **Vitest globals** | `describe`, `it`, `expect`, `vi`, etc. exposed without imports (`globals: true` in `vitest.config.ts`) |

---

> Single source of truth for the ThreatSea test setup. Update **this file** when anything in the test system changes.
