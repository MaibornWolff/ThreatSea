# ThreatSea – Test Documentation

## Table of Contents

1. [Testing Concept](#1-testing-concept)
2. [Frontend Component Tests (Vitest)](#2-frontend-component-tests-vitest)
3. [Playwright E2E Tests](#3-playwright-e2e-tests)
   - 3.1 [Architecture](#31-architecture)
   - 3.2 [Folder Layout](#32-folder-layout)
   - 3.3 [Naming Conventions](#33-naming-conventions)
   - 3.4 [Running Tests Locally](#34-running-tests-locally)
   - 3.5 [Role-Based / Multi-Identity Testing](#35-role-based--multi-identity-testing)
4. [Guidelines for New Testers](#4-guidelines-for-new-testers)
5. [CI/CD Integration](#5-cicd-integration)
6. [Stability & Maintenance](#6-stability--maintenance)
7. [Quick Start (Day 1)](#7-quick-start-day-1)

---

## 1. Testing Concept

```text
                      ┌───────────────────────────────┐
                      │  E2E (Playwright, 140 tests)  │
                      │  apps/frontend/playwright/    │
                      └───────────────────────────────┘
                                  ▲
                ┌──────────────────────────────────────────────┐
                │  Frontend Component Tests (Vitest)           │
                │  apps/frontend/src/**/*.{test,spec}.{ts,tsx} │
                └──────────────────────────────────────────────┘
                                  ▲
                ┌──────────────────────────────────────────────┐
                │  Backend Unit/Integration (Vitest)           │  (out of scope here)
                └──────────────────────────────────────────────┘
```

Component tests run on every commit and follow a co-location convention (test files live next to
what they cover). E2E runs locally today (see [section 5](#5-cicd-integration) for why it's not in
CI yet) and follows the Page Object Model conventions below to stay maintainable and handover-ready.

**Project-wide testing rules** (from `AGENTS.md`):

- **Vitest globals are enabled** — do not import `describe`, `it`, `expect`, `vi`, etc.
- **Test behavior, not implementation** — a refactor that preserves behavior must not break a test.
- **Meaningful assertions** — "does not throw" alone is not enough.
- **Cover edge cases** — empty input, null/undefined, errors, boundary values.

---

## 2. Frontend Component Tests (Vitest)

Tests are a **project convention**: they live next to the component they cover
(`button.component.tsx` → `button.component.test.tsx`). Vitest discovers files via
`include: ["src/**/*.{test,spec}.{ts,tsx}"]` in `vitest.config.ts` (`.test.ts`, `.test.tsx`,
`.spec.ts`, `.spec.tsx`). Use `@testing-library/react` + `@testing-library/user-event`; prefer
accessible queries (`getByRole`, `getByLabelText`) over `getByTestId`. `describe`/`it`/`expect`/
`vi` are Vitest globals — never imported. Testing a `disabled` MUI control needs
`userEvent.click(el, { pointerEventsCheck: 0 })`, since MUI disables pointer-events via CSS.

**Render through `renderWithProviders`** (`src/test-utils/render-with-providers.tsx`), not through
the bare `render()`. It supplies the Redux store, `MemoryRouter`, i18next and the MUI theme, and
takes `preloadedState` / `initialEntries`; the bare `render()` is for components that need none of
them. Prefer `preloadedState` over mocking `useAppSelector` — a partial fake state diverges from
the real store without anything failing.

**`vitest.config.ts` sets `isolate: false`**, so every test file runs against the same module
registry. A spy from `vi.spyOn()` therefore mutates a module that later files still see: install
spies in `beforeEach`, never at module load. For the same reason `react-i18next` must not be
mocked wholesale — that also strips the `I18nextProvider` which `renderWithProviders` relies on,
and a real `i18n.changeLanguage()` on the shared singleton flips the language for every file that
runs after it. `AGENTS.md` has the full rules.

```bash
pnpm --filter threatsea_fe test:unit:watch   # while iterating
pnpm --filter threatsea_fe test:unit         # single run
pnpm --filter threatsea_fe test:unit:coverage  # + coverage/index.html
```

Only the third command writes a report, into `apps/frontend/coverage/`. The
`apps/frontend/junit.xml` that CI picks up comes from `test:unit:ci` alone — none of the
commands above produce it.

---

## 3. Playwright E2E Tests

### 3.1 Architecture

E2E tests run a real browser against the full stack (frontend + backend + Postgres) and follow
the **Page Object Model**: `tests/` describe behavior only (no selectors, no hard waits) →
`pages/` (one class per route extending `BasePage`, owns all `Locator`s and page-level actions) →
`utils/` (typed API clients for fast setup/teardown) → `builder/`/`fixtures/`/`enums/` (payload
factories, JSON test data, shared enums).

`BasePage` itself is deliberately small: `navigate(path)` plus `getCsrfToken()`, which reads the
token the app writes to `localStorage` at login and throws if it is missing. Specs hand that token
to the `utils/` API clients, which send it as `x-csrf-token` — so API-driven setup and teardown
starts by asking a page object for it.

Key patterns:

- **Per-test isolation.** Every test namespaces its resources with `buildTestId(browserName,
testId)` so parallel runs and reruns don't collide.
- **API-driven setup/teardown.** `beforeEach` seeds via API, `afterEach` deletes what the test
  created — tests stay independent.
- **Auth once per browser.** `auth.setup.ts` logs in once per browser and stores the session in
  `tmp/.auth/<browser>-user.json`; every test reuses it.
- **UI only for the behavior under test.** Seed 10 projects via API to test sorting; don't click
  through 10 modals to set that up.

### 3.2 Folder Layout

```text
apps/frontend/playwright/
├── auth.setup.ts       # Per-browser login → tmp/.auth/<browser>-user.json
├── pages/               # 12 Page Objects (base.page.ts + one per route)
├── tests/               # 13 spec files, 140 tests total, e.g.:
│   ├── projects.page.e2e.spec.ts   # 7 tests
│   ├── editor.page.e2e.spec.ts     # 32 tests (some parameterized, e.g. per icon)
│   ├── members.page.e2e.spec.ts    # 23 tests (most run once for projects, once for catalogs)
│   └── risk.page.e2e.spec.ts       # 11 tests (2 quarantined, see 6.1)
├── fixtures/            # JSON test data
├── builder/             # test-data.builder.ts — buildTestId, buildProject, ...
├── enums/               # shared test enums
└── utils/               # api.utils.ts (fetchApi/fetchApiRaw) + one <resource>.api.ts per domain
```

Re-check exact counts with `pnpm --filter threatsea_fe playwright --list` before trusting them
for long — this table drifts the moment someone adds a test and forgets to come back here.

### 3.3 Naming Conventions

| Element             | Convention                                     | Example                                          |
| ------------------- | ---------------------------------------------- | ------------------------------------------------ |
| Spec / page object  | `<route>.page.e2e.spec.ts` / `<route>.page.ts` | `projects.page.e2e.spec.ts` / `projects.page.ts` |
| Page object class   | `PascalCase` + `Page`                          | `ProjectsPage`                                   |
| API helper file     | `<resource>.api.ts`                            | `project.api.ts`                                 |
| `data-testid` value | `<page>_<feature>_<element>`                   | `project-creation-modal_name-input`              |
| Test title          | `"Should <observable behavior>"`               | `"Should create new projects"`                   |
| Test resource name  | always include `buildTestId(...)`              | `` `${project.name}-${tid}` ``                   |

These apply to **new** tests. Parts of the suite predate them: the titles in `editor`,
`editor-drawing`, `footer-links` and `connection-editing` mostly don't start with `Should`, and a
number of older `data-testid`s sit outside the pattern (`AddMember`, `add-asset-dialog`). Take this
table as the reference, not the surrounding code, and don't rewrite existing tests just to conform.

### 3.4 Running Tests Locally

```bash
# Prerequisites (separate terminals): docker compose up -d postgres; pnpm dev --filter=threatsea_be
pnpm --filter threatsea_fe playwright:init   # install browsers; repeat after a Playwright bump
pnpm --filter threatsea_fe playwright        # headless, Chromium, 1 worker (local baseline; candidate CI shape)
pnpm --filter threatsea_fe playwright:ui     # interactive UI mode, recommended for debugging
PW_ALL_BROWSERS=1 pnpm --filter threatsea_fe playwright   # + Firefox and WebKit
```

Locally only Chromium runs. `PW_ALL_BROWSERS=1` (or `=true`) adds the Firefox and WebKit projects;
`CI=1` has the same effect. Each browser logs in as its own fixed profile in `auth.setup.ts`
(Chromium `testUser=2`, Firefox `3`, WebKit `4`), stores its session in
`tmp/.auth/<browser>-user.json`, and namespaces the resources it creates via
`buildTestId(browserName, ...)`, so the runs don't collide in a shared database.

**Chromium and Firefox pass; WebKit does not.** The backend defines four fixed profiles, indices
`0`–`3` (`fixedAuthentication.service.ts`), so WebKit's `testUser=4` does not exist: the login
redirects but sets no `accessToken` cookie. `auth.setup.ts` reports success anyway, because the
`csrfToken` it waits for is written per express-session rather than per identity — the resulting
`tmp/.auth/webkit-user.json` holds only `threatSea_session_id`. Every WebKit test then fails on
its first API call. Measured on 2026-09-17 with `projects.page.e2e.spec.ts`: 8/8 passing on
Chromium and on Firefox, 7/7 failing on WebKit. Fixing it takes a fifth backend profile or a
different index for WebKit; until then use Chromium and Firefox.

On failure: HTML report in `apps/frontend/playwright-report/`, traces/screenshots/video in
`apps/frontend/test-results/`.

### 3.5 Role-Based / Multi-Identity Testing

Needed whenever a test verifies what a **different role** (Editor, Viewer) may do, in addition to
the primary Owner identity `auth.setup.ts` logs in per browser. Pattern (`utils/auth.api.ts`):
`provisionFixedTestUser(testUserIndex)` creates/logs in one of the backend's fixed E2E profiles
(indices `0`–`1`, reserved — `2`/`3`/`4` are the browsers' own primary identities, though `4`
has no profile behind it, see [3.4](#34-running-tests-locally)) via an isolated
request context, just so it exists to be added as a member; add it with the role under test; then
`loginAsFixedTestUser(page, testUserIndex)` swaps **`page`'s** identity mid-test.

**Gotcha (already caused a false result in one of our own tests):** this only changes `page`'s
cookies. The `request` fixture has its own independent cookie jar seeded from `storageState` and
keeps acting as the original Owner even after the swap — a raw API call made with the bare
`request` fixture is silently still the Owner. Use `page.request` for API calls that must run as
the swapped-in identity (see `members.page.e2e.spec.ts`'s privilege-escalation test).

---

## 4. Guidelines for New Testers

**New E2E test:** find or create the page object (`<route>.page.ts` extends `BasePage`) → add any
missing `data-testid`s (with EN+DE translations) → add `Locator`s to the page object → add an API
helper if you need to seed/clean data → write `tests/<route>.page.e2e.spec.ts` with
`beforeEach`/`afterEach` isolation and `buildTestId(...)`-namespaced resources → run with
`playwright:ui` until green → open a PR.

**New component test:** place it next to the component, use Testing Library + `userEvent`, test
observable behavior (not internals) with at least one edge case → run
`test:unit:watch` → open a PR.

**Debugging a failing E2E test:** `pnpm --filter threatsea_fe exec playwright show-report` (there
is no package script for it) → open the failing test's **trace**
(screenshots, DOM snapshots, console/network logs) → `playwright:ui` to step through → `--headed
--debug` to watch it live → check the obvious environment causes (backend/Postgres running,
`.env.test` changed).

**Avoid:** hard waits (`page.waitForTimeout`), raw selectors in specs, shared mutable state
between tests, asserting on internals instead of user-visible behavior, and `test.only` in
committed code — nothing catches that one today: `forbidOnly` is tied to `CI`
(`forbidOnly: !!process.env["CI"]`), and the E2E suite doesn't run there (see §5). Reviewers have
to spot it.

---

## 5. CI/CD Integration

`.github/workflows/ci.yml` runs lint, backend, and frontend build/test (Vitest) on every PR and
push to `main`/`next`/`v*.*.x`. **Playwright is not wired in** — the E2E suite is local-only.
Not currently planned; if that changes, mirror `test-backend`'s Postgres service, set
`AUTH_METHOD=fixed`, install Chromium, start the backend, run
`pnpm --filter threatsea_fe playwright`, and upload the report/traces as artifacts.

---

## 6. Stability & Maintenance

**Flake prevention:** `data-testid` locators, auto-waiting/`expect(...).toBeVisible()` (never
`waitForTimeout`), one test = one behavior, `buildTestId(...)`-namespaced resources, always clean
up in `afterEach`.

### 6.1 Quarantine: flakes and known gaps

Two kinds of test end up quarantined: one that is genuinely unstable, and one that fails reliably
because of a known product gap or an environment artifact. The process below is the same for both
— that is what the `test.fixme` comments mean when they point at "the flake/known-gap process in
TESTING.md".

Quarantine immediately (`test.fixme(...)` + a comment explaining why) → open an issue → find the
root cause, never just add retries → fix and unquarantine (sprint review checks remaining
`fixme`s).

A consistently-failing automated test is evidence to investigate, not proof of a bug by itself.
Two `risk.page.e2e.spec.ts` cases made that concrete. One failure turned out to be a real
frontend/backend permission mismatch: reported to the dev team, but still waiting on a tracking
issue and a product decision, so the test stays quarantined. An outwardly identical one turned out
to only happen under React's `<StrictMode>` combined with Playwright's automation timing — never
reproducible manually, and confirmed as no real bug by removing `<StrictMode>` locally for one run
and watching the test pass. That was a diagnostic step, not a change: `<StrictMode>` is still in
`src/main.tsx`. Cross-check with a manual repro before reporting anything.

### 6.2 Cadence & targets

Per PR: new/changed tests alongside the feature. Weekly: review CI failure trends. Per sprint:
triage `test.fixme` items. Per quarter: Page Object refactor pass. Targets: E2E suite < 15 min on
CI, component suite < 3 min (shard with `--shard=1/N` if the E2E suite outgrows that).

---

## 7. Quick Start (Day 1)

From a fresh clone to a running test suite. 7.1, 7.2 and 7.4 are one-time setup; 7.3 and 7.5 are
what you run day to day.

### 7.1 Clone and install

```bash
git clone git@github.com:MaibornWolff/ThreatSea.git && cd ThreatSea
pnpm install
```

### 7.2 Create the backend `.env`

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
profiles back the role-based tests in [section 3.5](#35-role-based--multi-identity-testing).

### 7.3 Start database and backend

```bash
docker compose up -d postgres
pnpm dev --filter=threatsea_be
```

Give the backend its own terminal and leave it running. It applies pending Drizzle migrations on
startup, before it binds port 8000 — there is no separate migration step.

### 7.4 Install the Playwright browsers

Once per machine — and again whenever Playwright is upgraded, since each version pins its own
browser builds and launching against the old ones fails with "Executable doesn't exist":

```bash
pnpm --filter threatsea_fe playwright:init
```

### 7.5 Run the tests

```bash
pnpm --filter threatsea_fe test:unit:watch   # Vitest component tests, watch mode
pnpm --filter threatsea_fe playwright:ui     # Playwright UI mode
```

The frontend dev server is not in this list on purpose: Playwright starts it and reuses a running
one locally (`webServer.reuseExistingServer` in `playwright.config.ts`).

---

> Single source of truth for the ThreatSea test setup. Update **this file** when anything in the test system changes.
