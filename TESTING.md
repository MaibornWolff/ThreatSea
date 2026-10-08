# ThreatSea – Test Documentation

## Table of Contents

1. [Testing Concept](#1-testing-concept)
2. [Frontend Component Tests (Vitest)](#2-frontend-component-tests-vitest)
   - 2.1 [Canvas (react-konva) in component tests](#21-canvas-react-konva-in-component-tests)
3. [Backend Tests (Vitest)](#3-backend-tests-vitest)
4. [Playwright E2E Tests](#4-playwright-e2e-tests)
   - 4.1 [Architecture](#41-architecture)
   - 4.2 [Folder Layout](#42-folder-layout)
   - 4.3 [Naming Conventions](#43-naming-conventions)
   - 4.4 [Running Tests Locally](#44-running-tests-locally)
   - 4.5 [Role-Based / Multi-Identity Testing](#45-role-based--multi-identity-testing)
5. [Guidelines for New Testers](#5-guidelines-for-new-testers)
6. [CI/CD Integration](#6-cicd-integration)
7. [Stability & Maintenance](#7-stability--maintenance)
8. [Quick Start](#8-quick-start)

---

## 1. Testing Concept

```text
                      ┌───────────────────────────────┐
                      │  E2E (Playwright, 160 tests)  │
                      │  apps/frontend/playwright/    │
                      └───────────────────────────────┘
                                  ▲
                ┌──────────────────────────────────────────────┐
                │  Frontend Component Tests (Vitest)           │
                │  apps/frontend/src/**/*.{test,spec}.{ts,tsx} │
                └──────────────────────────────────────────────┘
                                  ▲
                ┌──────────────────────────────────────────────┐
                │  Backend Tests (Vitest)                      │
                │  apps/backend/tests/**/*.test.ts             │
                └──────────────────────────────────────────────┘
```

Frontend component tests and backend tests run in CI on every pull request and push (see
[section 6](#6-cicd-integration)) and, with the git hooks enabled, locally on every `git push` —
the `pre-push` hook runs `pnpm test`, while `pre-commit` only runs `type-check` and `lint-staged`.
Frontend component tests follow a co-location convention (test files live next to what they
cover); backend tests live in `apps/backend/tests/`. E2E runs locally only and follows the Page
Object Model conventions below to stay maintainable and handover-ready.

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
registry, **and `restoreMocks: true`**, so every spy is restored after each test. Two rules
follow from that:

- **Never `vi.mock` an `#api/` module — `vi.spyOn` the real one.** Every API module is reachable
  from `store.ts`, so an earlier test file that renders the store has already cached the real
  module; a later `vi.mock` never reaches it, and the test silently hits the network, passing or
  failing depending on file order. `src/test-utils/no-api-module-mocks.test.ts` enforces this;
  `use-report.hook.test.tsx` shows the pattern.
- **Install spies per test** (in `beforeEach` or the test itself), never at module load —
  `restoreMocks` removes a module-level spy after the first test.

For the same reason `react-i18next` must not be mocked wholesale — that also strips the
`I18nextProvider` which `renderWithProviders` relies on. A real `i18n.changeLanguage()` on the
shared singleton flips the language for every file that runs after it; to test a language switch,
render with `renderWithProviders(ui, { i18n: translationUtil.cloneInstance() })` and switch the
clone instead. `AGENTS.md` has the full rules.

```bash
pnpm --filter threatsea_fe test:unit:watch   # while iterating
pnpm --filter threatsea_fe test:unit         # single run
pnpm --filter threatsea_fe test:unit:coverage  # + coverage/index.html
```

Only the third command writes a report, into `apps/frontend/coverage/`. The
`apps/frontend/junit.xml` that CI picks up comes from `test:unit:ci` alone — none of the
commands above produce it.

### 2.1 Canvas (react-konva) in component tests

Konva draws into a real `<canvas>`, which jsdom cannot provide. `vitest.setup.ts` therefore replaces
`react-konva` and `react-konva-utils` **globally** with the stubs in `src/test-utils/konva-mock.ts`.
Never add a per-file `vi.mock("react-konva")`: under `isolate: false` it collides with the global one.
New canvas tests use the fakes and controls below instead of their own stubs.

- **Shapes are `<div>`s.** Each Konva node renders as `data-testid="konva-<shape>"` and carries the
  props worth asserting on as `data-*` attributes (`data-points`, `data-stroke`, `data-x`,
  `data-text`, …).
- **Handlers get Konva-shaped events.** Konva handler props are mapped onto DOM events
  (`onClick` → `click`, `onDragMove` → `drag`, `onDblClick` → `dblclick`, `onMouseEnter`/`onMouseOver`
  → `mouseenter`/`mouseover`, …), so `fireEvent` and `userEvent` reach them. The handler receives
  `{ evt, target, currentTarget, cancelBubble }`: `evt` is the native DOM event, `target` the element
  the event was fired on, extended with Konva node defaults (`getStage`, `getLayer`, `x`, `y`,
  `position`, `setPosition`, `stopDrag`, `startDrag`). Events bubble like in Konva, and a handler that
  sets `event.cancelBubble = true` stops the bubbling.
- **Stub a drag target via `fireEvent`.** Properties passed as `target` are assigned to the element
  and win over the defaults:

  ```ts
  fireEvent.drag(segmentLine, { target: { x: () => 20, y: () => 0, position: vi.fn() } });
  ```

  `connection-edit-handles.component.test.tsx` shows the pattern.

- **`<Stage>` is a stateful fake.** Its `ref` yields a fake Konva stage: `x()`, `y()`, `position()`,
  `scale()`, `scaleX()`/`scaleY()`, `width()`/`height()`, `getPointerPosition()`,
  `getRelativePointerPosition()` (pointer minus position, divided by scale) and `batchDraw()`.
  `content` is the `konva-stage` div itself, so cursor changes are observable as
  `screen.getByTestId("konva-stage").style.cursor`. Stage handlers (`onMouseDown`, `onMouseMove`,
  `onMouseUp`, `onMouseLeave`, `onContextMenu`, `onWheel`, `onClick`, `onDragOver`) get the fake stage
  as `target` when the event hits the empty stage and the shape's element otherwise, as in Konva.
  `evt.layerX/layerY` mirror `clientX/clientY` (jsdom has no `layerX`). Child nodes return the mounted
  fake stage from `getStage()`.
- **`<Layer>` with a `ref` is a fake layer** with `getClientRect()`, `find()` (always `[]`) and
  `toDataURL()`. By default it is empty: a 0 × 0 bounding box and the blank image `"data:,"`.
- **`konvaTestControls`** (exported from `konva-mock.ts`) drives what jsdom cannot measure.
  `vitest.setup.ts` calls `konvaTestControls.reset()` after every test.

  | Control                               | Effect                                                                                             |
  | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
  | `setStageSize({ width, height })`     | `stage.width()/height()`; wins over the setter (the editor sizes the stage to its 0 × 0 container) |
  | `setPointerPosition(point \| null)`   | `stage.getPointerPosition()`; otherwise the last mouse event's `clientX/clientY`                   |
  | `getMountedStage()`                   | the fake stage of the mounted `<Stage>`, or `null`                                                 |
  | `setLayerClientRect(rect)`            | `layer.getClientRect()` (content bounds for centering and image export)                            |
  | `setLayerDataUrl(dataUrl)`            | `layer.toDataURL()` (the exported image)                                                           |
  | `setLayerDataUrlError(error \| null)` | makes `layer.toDataURL()` throw `error`                                                            |

  ```ts
  fireEvent.contextMenu(screen.getByTestId("konva-stage"), { clientX: 120, clientY: 80, button: 2 });
  ```

- **Keyboard through `window.onkeyup`/`onkeydown`.** jsdom ignores handlers assigned to these
  properties, so `vitest.setup.ts` bridges them to real `keyup`/`keydown` events; `userEvent.keyboard`
  reaches them like in a browser.
- **No right-click via `click`.** React drops `click` events with `button: 2`, so a handler test with
  `fireEvent.click(element, { button: 2 })` passes without the handler ever running. Use `button: 1`
  to test a non-primary click, and `fireEvent.contextMenu` for the context menu.

**Per-file coverage threshold.** `editor.page.tsx` is only guarded by `editor.page.test.tsx`, because
E2E does not run in CI (§6). `vitest.config.ts` therefore holds a per-file entry under
`coverage.thresholds`, set to the measured values rounded down, which `test:unit:ci` enforces. When
coverage grows, raise the entry in the same PR. Lowering it needs a reason in the PR description, e.g.
a removed handler or code that cannot be reached through the UI.

---

## 3. Backend Tests (Vitest)

Backend tests live in `apps/backend/tests/` as `<resource>.test.ts`, with shared payloads in
`tests/testData/`. Unlike the frontend there is no co-location: `vitest.config.ts` only picks up
`./tests/**/*.{test,spec}.*`, so a test file placed next to the source never runs. Most of them
are integration tests — they drive the Express app through `supertest` against a real Postgres
database, so routers, services and the schema are covered together.

**They need Postgres, not a running backend.** `vitest.config.ts` loads `apps/backend/.env` (see
[8.3](#83-create-the-backend-env)) and overrides `DATABASE_NAME` with `threatsea_test`. The global
setup creates that database if it is missing, wipes its schema, runs the migrations and seeds one
user plus a default catalog; the global teardown drops the schema again. The dev database
`threatsea` is never touched. Since the `pre-push` hook runs these tests too, start Postgres
before you push.

**Authentication is mocked.** `vitest.setup.ts` mocks `jose`'s `jwtVerify`, so by default every
request is authenticated as the seeded user and tests don't log in.

```bash
docker compose up -d postgres
pnpm --filter threatsea_be test:watch   # while iterating
pnpm --filter threatsea_be test         # single run
```

CI runs `test:ci` instead, which adds coverage and writes `apps/backend/junit.xml`. Because it
runs with coverage, CI fails when coverage drops below the thresholds in `vitest.config.ts`.

---

## 4. Playwright E2E Tests

### 4.1 Architecture

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

### 4.2 Folder Layout

```text
apps/frontend/playwright/
├── auth.setup.ts       # Per-browser login → tmp/.auth/<browser>-user.json
├── pages/               # 12 Page Objects (base.page.ts + one per route)
├── tests/               # 13 spec files, 160 tests total, e.g.:
│   ├── projects.page.e2e.spec.ts   # 7 tests
│   ├── editor.page.e2e.spec.ts     # 34 tests (some parameterized, e.g. per icon)
│   ├── members.page.e2e.spec.ts    # 25 tests (most run once for projects, once for catalogs)
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

These apply to **new** tests. Parts of the suite predate them: the titles in `editor`,
`editor-drawing`, `footer-links` and `connection-editing` mostly don't start with `Should` (nor
does one in `catalog`), and a number of older `data-testid`s sit outside the pattern (`AddMember`,
`add-asset-dialog`). Take this table as the reference, not the surrounding code, and don't rewrite
existing tests just to conform.

### 4.4 Running Tests Locally

```bash
# Prerequisites (separate terminals): docker compose up -d postgres; pnpm dev --filter=threatsea_be
pnpm --filter threatsea_fe playwright:init   # install browsers; repeat after a Playwright bump
pnpm --filter threatsea_fe playwright        # headless, Chromium, 1 worker (local baseline; candidate CI shape)
pnpm --filter threatsea_fe playwright:ui     # interactive UI mode, recommended for debugging
PW_ALL_BROWSERS=1 pnpm --filter threatsea_fe playwright   # + Firefox and WebKit
```

Locally only Chromium runs. `PW_ALL_BROWSERS=1` (or `=true`) adds the Firefox and WebKit projects;
`CI=1` has the same effect. Each browser logs in as its own fixed profile in `auth.setup.ts`
(Chromium `testUser=1`, Firefox `2`, WebKit `3`), stores its session in
`tmp/.auth/<browser>-user.json`, and namespaces the resources it creates via
`buildTestId(browserName, ...)`, so the runs don't collide in a shared database.

The suite targets the Vite dev server on `http://localhost:3000`. If yours runs elsewhere, set
`PW_BASE_URL` (e.g. `PW_BASE_URL=http://localhost:3100`) and point the backend's `ORIGIN_APP` in
`apps/backend/.env` at the same origin — the fixed-auth login redirects to `ORIGIN_APP`, and
`auth.setup.ts` waits for that redirect to land on the base URL, so a mismatch times out the
login.

`auth.setup.ts` checks for the `accessToken` cookie right after the login redirect. A failed
fixed-auth login still redirects to the frontend, and the `csrfToken` it waits for afterwards is
scoped to the express session rather than the identity, so the cookie is the only proof the
browser is logged in; without it the setup project fails instead of writing a logged-out storage
state. A browser with no profiles mapped in `utils/auth.api.ts` fails the setup as well.

The backend's fixed profiles (`fixedAuthentication.service.ts`) are indexed by `testUser`. Each
browser owns its own set, so the three projects can run in parallel without one browser's tests
touching another browser's users:

| Index | Profile                                | Used by                              |
| ----- | -------------------------------------- | ------------------------------------ |
| `0`   | `testfn testsn` (`test@test.test`)     | Devs locally — **never** used by E2E |
| `1`   | `E2E Testing` (`test2@test.test`)      | Chromium owner                       |
| `2`   | `E2E Testing` (`test3@test.test`)      | Firefox owner                        |
| `3`   | `E2E Testing` (`test4@test.test`)      | WebKit owner                         |
| `4/5` | `Chromium Secondary A/B` (`test5/6@…`) | Chromium secondary identities (§4.5) |
| `6/7` | `Firefox Secondary A/B` (`test7/8@…`)  | Firefox secondary identities (§4.5)  |
| `8/9` | `WebKit Secondary A/B` (`test9/10@…`)  | WebKit secondary identities (§4.5)   |

The mapping lives in one place, `fixedTestUsersFor(browserName)` in `utils/auth.api.ts`, which
`auth.setup.ts` and the role-based tests both read. A new browser project needs three new backend
profiles (owner, secondary A and B) and an entry there, not reused indices.

On failure: HTML report in `apps/frontend/playwright-report/`, traces/screenshots/video in
`apps/frontend/test-results/`.

### 4.5 Role-Based / Multi-Identity Testing

Needed whenever a test verifies what a **different role** (Editor, Viewer) may do, in addition to
the primary Owner identity `auth.setup.ts` logs in per browser. Pattern (`utils/auth.api.ts`):
take the browser's own secondary identities from `fixedTestUsersFor(browserName)` (`secondaryA`,
`secondaryB`, see the table in [4.4](#44-running-tests-locally)) — never a hard-coded index, and
never index `0`. `provisionFixedTestUser(testUserIndex)` creates/logs in that profile via an
isolated request context, just so it exists to be added as a member; add it with the role under
test; then `loginAsFixedTestUser(page, testUserIndex)` swaps **`page`'s** identity mid-test.

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
`playwright:ui` until green → open a PR.

**New component test:** place it next to the component, use Testing Library + `userEvent`, test
observable behavior (not internals) with at least one edge case → run
`test:unit:watch` → open a PR.

**New backend test:** add `apps/backend/tests/<resource>.test.ts`, drive the endpoint through
`supertest` and assert on the response and the resulting database state, including the error
paths (missing permission, invalid payload, unknown id) → run `test:watch` with Postgres up → open
a PR.

**Debugging a failing E2E test:** `pnpm --filter threatsea_fe exec playwright show-report` (there
is no package script for it) → open the failing test's **trace**
(screenshots, DOM snapshots, console/network logs) → `playwright:ui` to step through → `--headed
--debug` to watch it live → check the obvious environment causes (backend/Postgres running,
`.env.test` changed).

**Avoid:** hard waits (`page.waitForTimeout`), raw selectors in specs, shared mutable state
between tests, asserting on internals instead of user-visible behavior, and `test.only` in
committed code — nothing catches that one today: `forbidOnly` is tied to `CI`
(`forbidOnly: !!process.env["CI"]`), and the E2E suite doesn't run there (see §6). Reviewers have
to spot it.

---

## 6. CI/CD Integration

`.github/workflows/ci.yml` runs lint, backend, and frontend build/test (Vitest) on every PR and
push to `main`/`next`/`v*.*.x`. **Playwright is not wired in** — the E2E suite is local-only.

---

## 7. Stability & Maintenance

**Flake prevention:** `data-testid` locators, auto-waiting/`expect(...).toBeVisible()` (never
`waitForTimeout`), one test = one behavior, `buildTestId(...)`-namespaced resources, always clean
up in `afterEach`.

### 7.1 Quarantine: flakes and known gaps

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

### 7.2 Cadence & targets

Per PR: new/changed tests alongside the feature. Weekly: review CI failure trends. Per sprint:
triage `test.fixme` items. Per quarter: Page Object refactor pass. Targets: E2E suite < 15 min on
CI, component suite < 3 min (shard with `--shard=1/N` if the E2E suite outgrows that).

---

## 8. Quick Start

From a fresh clone to a running test suite. 8.1–8.3 are one-time setup; 8.4 and 8.5 are what you
run day to day.

### 8.1 Clone and install

```bash
git clone git@github.com:MaibornWolff/ThreatSea.git && cd ThreatSea
pnpm install
```

### 8.2 Install the Playwright browsers

Once per machine — and again whenever Playwright is upgraded, since each version pins its own
browser builds and launching against the old ones fails with "Executable doesn't exist":

```bash
pnpm --filter threatsea_fe playwright:init
```

### 8.3 Create the backend `.env`

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
`ORIGIN_APP` has to match the frontend origin Playwright tests against; change both together (see
`PW_BASE_URL` in [4.4](#44-running-tests-locally)).

### 8.4 Start database and backend

```bash
docker compose up -d postgres
pnpm dev --filter=threatsea_be
```

Give the backend its own terminal and leave it running. It applies pending Drizzle migrations on
startup, before it binds port 8000 — there is no separate migration step.

### 8.5 Run the tests

```bash
pnpm --filter threatsea_fe test:unit:watch   # Vitest component tests, watch mode
pnpm --filter threatsea_be test:watch        # Vitest backend tests, watch mode
pnpm --filter threatsea_fe playwright:ui     # Playwright UI mode
```

The backend tests only need Postgres, not the running backend — see
[section 3](#3-backend-tests-vitest).

The frontend dev server is not in this list on purpose: Playwright starts it and reuses a running
one locally (`webServer.reuseExistingServer` in `playwright.config.ts`).

---

> Single source of truth for the ThreatSea test setup. Update **this file** when anything in the test system changes.
