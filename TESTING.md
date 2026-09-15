# ThreatSea – Test Documentation

> **Audience:** New testers joining the project, or contributors who need to understand the test setup end-to-end.
> **Scope:** Frontend component tests (Vitest) and end-to-end tests (Playwright) for [ThreatSea](https://github.com/MaibornWolff/ThreatSea), the threat-modeling tool by MaibornWolff.

**Last updated:** 2026-09-04
**Owners:** Katharina (FE Component Tests) · Yassine (Playwright / E2E / CI)

---

## Table of Contents

1. [Testing Concept](#1-testing-concept)
2. [Roles & Responsibilities](#2-roles--responsibilities)
3. [Repository Layout (Test-Relevant)](#3-repository-layout-test-relevant)
4. [Frontend Component Tests (Vitest)](#4-frontend-component-tests-vitest)
5. [Playwright E2E Tests](#5-playwright-e2e-tests)
   - 5.1 [Architecture & Structure](#51-architecture--structure)
   - 5.2 [The Page Object Model](#52-the-page-object-model)
   - 5.3 [Test Strategy](#53-test-strategy)
   - 5.4 [Folder Layout](#54-folder-layout)
   - 5.5 [Naming Conventions](#55-naming-conventions)
   - 5.6 [Worked Example](#56-worked-example)
   - 5.7 [Running Tests Locally](#57-running-tests-locally)
   - 5.8 [Role-Based / Multi-Identity Testing](#58-role-based--multi-identity-testing)
6. [The POM Migration](#6-the-pom-migration)
7. [Guidelines for New Testers](#7-guidelines-for-new-testers)
8. [CI/CD Integration for the Playwright Suite](#8-cicd-integration-for-the-playwright-suite)
9. [Stability & Maintenance](#9-stability--maintenance)
10. [Quick Start (Day 1)](#10-quick-start-day-1)
11. [Glossary](#11-glossary)

---

## 1. Testing Concept

ThreatSea follows a classic test pyramid:

```
                      ┌───────────────────────────────┐
                      │  E2E (Playwright, 125 tests)  │  ← Yassine
                      │  apps/frontend/playwright/    │
                      └───────────────────────────────┘
                                  ▲
                                  │
                ┌──────────────────────────────────────┐
                │  Frontend Component Tests (Vitest)   │  ← Katharina
                │  apps/frontend/src/**/*.test.tsx     │
                └──────────────────────────────────────┘
                                  ▲
                                  │
                ┌──────────────────────────────────────┐
                │  Backend Unit/Integration (Vitest)   │  (out of scope here)
                │  apps/backend/                       │
                └──────────────────────────────────────┘
```

**Goals**

| Goal                    | How we achieve it                                                                |
| ----------------------- | -------------------------------------------------------------------------------- |
| Catch regressions early | Run component tests on every commit; E2E on every PR (target state)              |
| Stay maintainable       | Page Object Model for E2E, co-located component tests, strict naming conventions |
| Stay handover-ready     | This document + `AGENTS.md` + `README.md` + `apps/frontend/playwright/` source   |
| Stay fast in CI         | Single-worker Chromium locally, full matrix on CI; reuse auth state across tests |

**Project-wide testing rules** (from `AGENTS.md`)

- **Vitest globals are enabled.** Do **not** import `describe`, `it`, `expect`, `vi`, `beforeEach`, etc. from `"vitest"`. They are global.
- **Test behavior, not implementation.** Assertions verify the contract (inputs → observable outputs). A refactor that preserves behavior must not break the test.
- **Meaningful assertions.** "Does not throw" / "is defined" alone is not enough.
- **Cover edge cases.** Empty input, null/undefined, errors, boundary values.

---

## 2. Roles & Responsibilities

### Katharina – Frontend Component Tests

- Writes and maintains **`<name>.component.test.tsx`** files next to their components under `apps/frontend/src/`.
- Verifies that each UI building block (button, dialog, picker, grid, …) renders correctly, handles props, and reacts to user events — in isolation.
- Reviews PRs that touch frontend components for adequate component-test coverage.

### Yassine – End-to-End Tests (Playwright) & CI

- Owns `apps/frontend/playwright/`.
- Migrated the original **63 Playwright tests** to the **Page Object Model** (May 2026). The suite
  has since grown to **125 tests across 13 spec files**, following the same pattern for every
  new page (Members, Report, Footer links, Editor drawing, Connection editing, Risk).
- Drives the integration of the Playwright suite into `.github/workflows/ci.yml` (not yet wired
  up — see [section 8](#8-cicd-integration-for-the-playwright-suite)).
- Reviews PRs that change page objects, fixtures, or API helpers.

### Shared

- Both review each other's test changes when out of office.
- Both keep this document up to date — any change to the test system must be reflected here.

---

## 3. Repository Layout (Test-Relevant)

```
ThreatSea/                            # pnpm + Turborepo monorepo
├── apps/
│   ├── backend/                      # Express 5, Drizzle ORM, Postgres, socket.io
│   └── frontend/                     # React 19, Vite 8, MUI v9, Redux Toolkit, react-konva
│       ├── playwright.config.ts      # Playwright config (browsers, auth, retries, reporter)
│       ├── playwright/               # ── E2E test root ──
│       │   ├── auth.setup.ts         # Logs in per-browser, stores auth state
│       │   ├── pages/                # Page Objects (POM)
│       │   ├── tests/                # *.e2e.spec.ts
│       │   ├── fixtures/             # JSON test data
│       │   ├── builder/              # Payload builders + unique-ID helpers
│       │   ├── enums/                # Shared test enums
│       │   └── utils/                # API clients & fetch helper
│       ├── src/                      # ── Application + component tests live here ──
│       │   └── ...
│       │       └── <name>.component.test.tsx
│       ├── vitest.config.ts          # Vitest config (jsdom, globals, coverage)
│       └── package.json              # Scripts: test:unit, playwright, ...
├── .github/
│   └── workflows/
│       └── ci.yml                    # Current CI (lint, build, unit tests — no Playwright yet)
├── AGENTS.md                         # Canonical guidance for any contributor / agent
└── README.md                         # Project overview + E2E quick start
```

---

## 4. Frontend Component Tests (Vitest)

### 4.1 What we test

- **Rendering** with different props
- **User interaction** (clicks, typing, hover) via `@testing-library/user-event`
- **Accessible queries** — prefer `getByRole`, `getByLabelText`, `getByText` over CSS selectors
- **Edge cases** — disabled state, empty input, error props, boundary values

### 4.2 Where they live

Tests live **next to the component** they cover:

```
src/view/components/button.component.tsx
src/view/components/button.component.test.tsx     ← here
```

This is enforced via the `include` pattern in `vitest.config.ts`:

```ts
include: ["src/**/*.{test,spec}.{ts,tsx}"];
```

### 4.3 Worked example – `button.component.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button.component";

describe("Button", () => {
  it("should render its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    await userEvent.click(screen.getByRole("button", { name: "Disabled" }), {
      pointerEventsCheck: 0, // MUI disables pointer-events via CSS
    });

    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

Note: `describe`, `it`, `expect`, `vi` come from Vitest globals — no import needed.

### 4.4 Running

From the **frontend workspace** or repo root via the `--filter` flag:

```bash
# Watch mode (use while writing tests)
pnpm --filter threatsea_fe test:unit:watch

# Single run
pnpm --filter threatsea_fe test:unit

# With coverage report (open coverage/index.html afterwards)
pnpm --filter threatsea_fe test:unit:coverage

# What CI uses (JUnit + coverage)
pnpm --filter threatsea_fe test:unit:ci
```

Reports land in `apps/frontend/coverage/` and `apps/frontend/junit.xml`.

### 4.5 Conventions

| Item        | Convention                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| File name   | `<name>.component.test.tsx` next to `<name>.component.tsx`                                                                   |
| Test runner | Vitest (jsdom environment)                                                                                                   |
| Library     | `@testing-library/react` + `@testing-library/user-event`                                                                     |
| Mocking     | `vi.fn()` / `vi.mock(...)` — keep mocks minimal; mock the I/O layer, not internal helpers                                    |
| Selectors   | Accessible queries (`getByRole`, `getByLabelText`) — fall back to `getByTestId` only when there is no accessible alternative |

---

## 5. Playwright E2E Tests

### 5.1 Architecture & Structure

E2E tests run a real browser against the running ThreatSea stack (frontend + backend + Postgres). They live under `apps/frontend/playwright/` and follow the **Page Object Model**.

```
┌──────────────────────────────────────────────────────────────┐
│  tests/  (*.e2e.spec.ts)                                     │
│  Describe user-visible behavior. No selectors here.          │
└──────────────────────────────────────────────────────────────┘
                       │ uses
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  pages/  (BasePage + one Page Object per route)              │
│  Encapsulate selectors and page-level interactions.          │
└──────────────────────────────────────────────────────────────┘
                       │ uses
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  utils/  (api.utils.ts + <resource>.api.ts)                  │
│  Typed API clients for fast test setup/teardown.             │
└──────────────────────────────────────────────────────────────┘
                       │ uses
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  builder/  +  fixtures/  +  enums/                           │
│  Payload builders, JSON test data, shared enums.             │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 The Page Object Model

Each page (or major UI surface) gets one class extending `BasePage`. The page object owns **all** locators for that page and exposes verb-shaped helpers.

**`pages/base.page.ts` (abstract base)**

```ts
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async getCsrfToken(): Promise<string> {
    const token = await this.page.evaluate(() => localStorage.getItem("csrfToken"));
    if (!token) throw new Error("CSRF token not found. Is the user logged in?");
    return token;
  }

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
```

`getCsrfToken()` is used by API helpers so tests can create/delete data without going through the UI.

**Layer responsibilities**

| Layer       | Contains                                                          | Does **not** contain                           |
| ----------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| `tests/`    | `test()`, `expect()`, business flow                               | `data-testid` strings, raw `page.locator(...)` |
| `pages/`    | `Locator` declarations, action methods (`addProject`, `openMenu`) | Business-level assertions, fixture data        |
| `utils/`    | API clients, request helpers                                      | UI interactions                                |
| `builder/`  | Payload factories, unique-ID helpers (`buildTestId`)              | UI interactions                                |
| `fixtures/` | Static JSON data                                                  | Code                                           |

### 5.3 Test Strategy

| Type                    | Purpose                                                  | Example                        |
| ----------------------- | -------------------------------------------------------- | ------------------------------ |
| **Smoke**               | Most critical flows must always pass                     | Login → projects page loads    |
| **CRUD**                | Create/Read/Update/Delete via UI, verified via API or UI | Create project, edit, delete   |
| **Navigation**          | Routing and deep-linking                                 | Project card → sub-pages       |
| **Sorting / Filtering** | List-page logic                                          | Sort by name/date asc/desc     |
| **Validation**          | Negative paths, invalid input                            | Reject invalid project payload |

#### Patterns we use

1. **Per-test isolation via unique IDs.** Every test names its resources with `buildTestId(browserName, testId)` so parallel browsers and reruns don't collide.
2. **API-driven setup/teardown.** `beforeEach` seeds the backend via API; `afterEach` deletes everything the test created. Tests are independent.
3. **Auth-once-per-browser.** `auth.setup.ts` logs in once and stores the session in `tmp/.auth/<browser>-user.json`. Every test reuses it.
4. **UI for the action under test, API for everything else.** Don't click your way through 10 modals to test sorting — seed 10 projects via API, then exercise the sort UI.

### 5.4 Folder Layout

```
apps/frontend/playwright/
├── auth.setup.ts                          # Per-browser login → tmp/.auth/<browser>-user.json
├── pages/
│   ├── base.page.ts                       # Abstract BasePage (CSRF, navigate)
│   ├── projects.page.ts
│   ├── catalogs.page.ts
│   ├── catalog.page.ts
│   ├── assets.page.ts
│   ├── threats.page.ts
│   ├── measures.page.ts
│   ├── editor.page.ts
│   ├── footer-links.page.ts
│   ├── members.page.ts
│   ├── report.page.ts
│   └── risk.page.ts
├── tests/
│   ├── projects.page.e2e.spec.ts           # 7 tests
│   ├── catalogs.page.e2e.spec.ts           # 7 tests
│   ├── catalog.page.e2e.spec.ts            # 17 tests
│   ├── assets.page.e2e.spec.ts             # 8 tests
│   ├── threats.page.e2e.spec.ts            # 1 test
│   ├── measures.page.e2e.spec.ts           # 8 tests
│   ├── editor.page.e2e.spec.ts             # 29 tests
│   ├── editor-drawing.page.e2e.spec.ts     # 8 tests
│   ├── connection-editing.page.e2e.spec.ts # 2 tests
│   ├── footer-links.page.e2e.spec.ts       # 3 tests
│   ├── members.page.e2e.spec.ts            # 14 tests
│   ├── report.page.e2e.spec.ts             # 10 tests
│   └── risk.page.e2e.spec.ts               # 11 tests (2 quarantined, see 9.2)
├── fixtures/                              # JSON test data
│   ├── projects.json
│   ├── catalogs.json
│   ├── catalog.json
│   ├── assets.json
│   ├── threats.json                       # also reused by the Risk suite
│   ├── measures.json
│   └── custom-icon.png
├── builder/
│   └── test-data.builder.ts               # buildTestId, buildProject, buildCatalogContentItems
├── enums/
│   └── catalog.enums.ts
└── utils/
    ├── api.utils.ts                       # fetchApi()/fetchApiRaw() — CSRF-protected requests
    ├── auth.api.ts                        # fixed-profile login/provisioning, see 5.8
    ├── project.api.ts
    ├── catalog.api.ts
    ├── catalog-content.api.ts
    ├── asset.api.ts
    ├── folder.api.ts
    ├── measure.api.ts
    ├── measure-impact.api.ts
    ├── member.api.ts
    └── threat.api.ts
```

Counts reflect the suite as of this update (125 tests total); re-check with
`pnpm --filter threatsea_fe playwright --list` before trusting them for long — this table tends
to drift the moment someone adds a test and forgets to come back here.

### 5.5 Naming Conventions

| Element             | Convention                                                                             | Example                                            |
| ------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Spec file           | `<route>.page.e2e.spec.ts`                                                             | `projects.page.e2e.spec.ts`                        |
| Page object file    | `<route>.page.ts`                                                                      | `projects.page.ts`                                 |
| Page object class   | `PascalCase + Page`                                                                    | `ProjectsPage`                                     |
| API helper file     | `<resource>.api.ts`                                                                    | `project.api.ts`                                   |
| Locator strategy    | `data-testid` attributes                                                               | `[data-testid="projects-page_add-project-button"]` |
| `data-testid` value | `<page>_<feature>_<element>` (snake separators within segments, kebab within elements) | `project-creation-modal_name-input`                |
| Test title          | `"Should <observable behavior>"`                                                       | `"Should create new projects"`                     |
| Describe block      | `"<Page> Tests"`                                                                       | `"Projects Page Tests"`                            |
| Test resource name  | always include `buildTestId(...)`                                                      | `` `${project.name}-${tid}` ``                     |

### 5.6 Worked Example

This is the actual pattern used throughout `apps/frontend/playwright/`.

**Page Object — `pages/projects.page.ts`** (excerpt)

```ts
export class ProjectsPage extends BasePage {
  readonly url = "/projects";

  readonly addProjectButton: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly catalogSelection: Locator;
  readonly saveButton: Locator;
  readonly projectCards: Locator;
  readonly projectCardNames: Locator;

  constructor(page: Page) {
    super(page);
    this.addProjectButton = page.locator('[data-testid="projects-page_add-project-button"]');
    this.nameInput = page.locator('[data-testid="project-creation-modal_name-input"] input');
    this.descriptionInput = page.locator(
      '[data-testid="project-creation-modal_description-input"] textarea[name="description"]'
    );
    this.catalogSelection = page.locator('[data-testid="project-creation-modal_catalog-selection"]');
    this.saveButton = page.locator('[data-testid="save-button"]');
    this.projectCards = page.locator('[data-testid="projects-page_project-card"]');
    this.projectCardNames = page.locator('[data-testid="projects-page_project-card_project-name"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }
}
```

**Spec — `tests/projects.page.e2e.spec.ts`** (one test)

```ts
import { test, expect } from "@playwright/test";
import { ProjectsPage } from "../pages/projects.page.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { createCatalog, deleteCatalog, getCatalogs } from "../utils/catalog.api.ts";
import { getProjects, deleteProjects } from "../utils/project.api.ts";

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.goto();
  const token = await projectsPage.getCsrfToken();

  await createCatalog(request, token, {
    name: `Sample-Catalog-${buildTestId(browserName, testId)}`,
    language: "EN",
    defaultContent: true,
  });
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
  const token = await new ProjectsPage(page).getCsrfToken();
  const tid = buildTestId(browserName, testId);

  const allProjects = await getProjects(request, token);
  await deleteProjects(
    request,
    token,
    allProjects.filter((p) => p.name.includes(tid)).map((p) => p.id)
  );

  const catalogs = await getCatalogs(request, token);
  const ours = catalogs.find((c) => c.name.includes(tid));
  if (ours) await deleteCatalog(request, token, ours.id);
});

test("Should create new projects", async ({ page, browserName }, { testId }) => {
  const projectsPage = new ProjectsPage(page);
  const tid = buildTestId(browserName, testId);

  await projectsPage.addProjectButton.click();
  await projectsPage.nameInput.fill(`My Project-${tid}`);
  await projectsPage.descriptionInput.fill("A description");
  await projectsPage.catalogSelection.click();
  await page.locator("role=option").filter({ hasText: tid }).first().click();
  await projectsPage.saveButton.click();

  await expect(projectsPage.projectCards).toHaveCount(1);
});
```

**What to learn from this**

- The spec contains **no** raw selectors and **no** hard waits.
- Per-test data is namespaced via `tid` so cleanup is precise.
- Setup creates dependencies (a catalog) via API; the UI is exercised only on the actual subject under test.

### 5.7 Running Tests Locally

Prerequisites (all from the project root, separate terminals):

```bash
# 1. Postgres
docker compose up -d postgres

# 2. Backend
pnpm dev --filter=threatsea_be

# 3. (Frontend is auto-started by Playwright via webServer if not running)
```

Install Playwright browsers **once** per machine:

```bash
pnpm --filter threatsea_fe playwright:init
```

Run tests:

```bash
# Headless, Chromium, 1 worker (matches CI behavior, fastest path)
pnpm --filter threatsea_fe playwright

# Interactive UI mode (recommended for debugging)
pnpm --filter threatsea_fe playwright:ui

# Run all browsers locally (chromium + firefox + webkit)
PW_ALL_BROWSERS=1 pnpm --filter threatsea_fe playwright

# Single spec
pnpm --filter threatsea_fe playwright playwright/tests/projects.page.e2e.spec.ts

# Headed mode (watch the browser run)
pnpm --filter threatsea_fe playwright --headed

# Show the HTML report from the last run
pnpm --filter threatsea_fe playwright show-report
```

Artifacts on failure:

- HTML report → `apps/frontend/playwright-report/index.html`
- Screenshots, traces, video → `apps/frontend/test-results/`

---

### 5.8 Role-Based / Multi-Identity Testing

Added for the Members suite and reused since (e.g. Risk) whenever a test needs to verify what
someone with a **different role** (Editor, Viewer) is allowed to do, in addition to the primary
Owner identity `auth.setup.ts` logs in per browser.

**The pattern (`utils/auth.api.ts`):**

- `provisionFixedTestUser(testUserIndex)` — creates/logs in one of the backend's fixed E2E
  profiles (`fixedAuthentication.service.ts`, indices `0`–`3`) via an **isolated** API request
  context, purely so the user row exists and can be added as a project/catalog member. Indices
  `0` and `1` are reserved for this (never used as a browser's primary identity — those are
  `2`/`3`/`4` for chromium/firefox/webkit, see `auth.setup.ts`).
- Add that profile as a member with the role you want to test, via the existing member API
  helpers (`addMember`, mirroring what the UI's "Add Member" dialog does).
- `loginAsFixedTestUser(page, testUserIndex)` — swaps the **browser's** identity mid-test by
  navigating `page` to the fixed-login endpoint. From this point on, UI actions in that test run
  as the new role.

**The one gotcha that has already caused a false result in one of our own tests:** `loginAsFixedTestUser` only
changes `page`'s cookies. The `request` fixture Playwright gives each test has its **own,
independent cookie jar**, seeded once from the project's `storageState` — it keeps acting as the
original Owner even after you've swapped `page` to a different identity. A direct API call made
with the bare `request` fixture after a swap is silently still authenticated as the Owner, which
can produce a false pass/fail that has nothing to do with the role you meant to test. If you need
to make a raw API request **as the swapped-in identity**, use `page.request`, not `request` — see
`members.page.e2e.spec.ts`'s privilege-escalation regression test for the correct pattern.

```ts
// Provisioning/adding the secondary member (see steps above) still happens via `request`,
// which is fine — it's meant to keep acting as the Owner for setup and cleanup.
await loginAsFixedTestUser(page, SECONDARY_TEST_USER_A.testUserIndex); // page is now the Editor
const editorToken = await pg.getCsrfToken();

// Correct — page.request shares page's cookie jar, so this really runs as the Editor.
await fetchApiRaw(page.request, editorToken, "PUT", `/projects/${projectId}`, body);

// Wrong — `request` is a separate context still holding the Owner's session from
// storageState, so this silently succeeds or fails as the Owner, not the Editor.
await fetchApiRaw(request, editorToken, "PUT", `/projects/${projectId}`, body);
```

---

## 6. The POM Migration

### 6.1 What was wrong before

- Selectors (`page.locator('[data-testid="..."]')`) lived directly in spec files.
- The same flow (login, create project, …) was copy-pasted across many tests.
- A small UI change (renamed `data-testid`, restructured modal) required edits in dozens of places.
- Tests were hard to read — the business intent was buried under technical detail.

### 6.2 How the migration was executed

1. **Inventory** of all 63 tests, grouped by page (`projects`, `catalog`, `assets`, `threats`, `measures`, `editor`, `catalogs`).
2. **Identification** of common selectors and recurring flows per page.
3. **Designed `BasePage`** as the shared abstract class (CSRF helper, navigation).
4. **Created one Page Object per route**, declaring every selector as a typed `Locator` property.
5. **Added API helpers** (`utils/<resource>.api.ts`) so tests can seed and clean up data without UI cost.
6. **Added builders** (`buildTestId`, `buildProject`, `buildCatalog`, …) for unique, per-test payloads.
7. **Rewrote each spec** to use the page objects and helpers only — verified by running the suite green per file.

Every page added since (Members, Report, Footer links, Editor drawing, Connection editing, Risk)
followed this same structure from the start rather than needing a migration — see [section
5.4](#54-folder-layout) for the current, full list.

### 6.3 What we got out of it

- **Single source of truth for selectors.** Renaming a `data-testid` is a one-line change in the page object.
- **Tests read like behavior.** A new contributor can skim a spec and understand intent without knowing the DOM.
- **Stable parallelism.** Per-test unique IDs + per-test cleanup mean tests don't pollute each other.
- **API-driven setup.** Tests run faster because non-essential UI flows (e.g. seeding 10 projects) are done over HTTP.
- **Onboarding friction dropped sharply.** A new tester only needs to understand `BasePage`, the page object pattern, and `buildTestId` to be productive.

---

## 7. Guidelines for New Testers

### 7.1 Writing a new E2E test

1. Identify the page. If it has no page object, create `<route>.page.ts` extending `BasePage`.
2. Add the `data-testid` attributes you need in the React component (follow existing naming: `<page>_<feature>_<element>`). All user-facing strings need translations in `translations/en/` **and** `translations/de/`.
3. Add `Locator` properties for each selector in the page object.
4. Add an API helper in `utils/` if you need to seed/clean data programmatically.
5. Write the spec in `tests/<route>.page.e2e.spec.ts`. Use `beforeEach` + `afterEach` for isolation; namespace all resources with `buildTestId(browserName, testId)`.
6. Run locally with `playwright:ui`, fix until green.
7. Open a PR. Reviewer is Yassine.

### 7.2 Writing a new component test

1. Place the file next to the component as `<name>.component.test.tsx`.
2. Use `@testing-library/react` + `userEvent`.
3. Do **not** import from `"vitest"` — globals are enabled.
4. Test observable behavior, not internals. No "renders without crashing" as the only assertion.
5. Include at least one negative / edge case (disabled, empty, invalid).
6. Run `pnpm --filter threatsea_fe test:unit:watch` while iterating.
7. Open a PR. Reviewer is Katharina.

### 7.3 Debugging a failing E2E test

In rough order of effort:

1. `pnpm --filter threatsea_fe playwright show-report` — see the HTML report.
2. In the report, expand the failing test → open the **trace**. It includes screenshots before/after every action, DOM snapshots, console logs, network requests.
3. Re-run in UI mode and step through: `pnpm --filter threatsea_fe playwright:ui`.
4. Add `await page.pause()` to drop into the Playwright inspector.
5. Re-run with `--headed --debug` to watch the browser live.
6. Check if the failure is environment-specific: is the backend running? Postgres? Did `.env.test` change?

### 7.4 What to avoid

- ❌ Hard waits (`page.waitForTimeout(1000)`). Use auto-waiting locators or `expect(locator).toBeVisible()`.
- ❌ Raw selectors in specs (`page.locator(...)` directly in a test).
- ❌ Sharing mutable state between tests.
- ❌ Asserting on internal implementation (private state, specific method calls on mocks). Test what the user sees.
- ❌ `it.only` / `test.only` in committed code. `playwright.config.ts` sets `forbidOnly: true` in CI — your PR will fail.

---

## 8. CI/CD Integration for the Playwright Suite

### 8.1 Current State

`.github/workflows/ci.yml` already runs on **PRs to any branch** and on **push to `main` / `next` / `v*.*.x` / tags**. Jobs today:

```
lint  →  build-backend  →  test-backend  ────┐
      ↘                                       ├→  build-container-image  →  release
        build-frontend → test-frontend  ─────┘
```

`test-frontend` runs `pnpm --filter threatsea_fe test:unit:ci` (Vitest + JUnit + coverage). **Playwright is not yet integrated.** This section describes how to close that gap.

### 8.2 Triggers

The new `e2e-frontend` job will inherit the existing `on:` block — it will run automatically on:

- **Every PR** (`pull_request` to any branch)
- **Every push** to `main`, `next`, and `v*.*.x` branches and tags

No additional configuration needed.

### 8.3 Proposed pipeline shape

```
lint  →  build-backend  →  test-backend  ─────────────┐
      ↘                                                ├→  build-container-image  →  release
        build-frontend ─→ test-frontend       ────────┤
                       ↘                               │
                         e2e-frontend  (NEW)  ────────┘
```

### 8.4 Proposed job — `e2e-frontend`

To be added to `.github/workflows/ci.yml`. Mirrors `test-backend` in setup (Postgres service, env vars), reuses the existing `repository-setup` composite action.

```yaml
e2e-frontend:
  name: E2E Frontend (Playwright)
  runs-on: ubuntu-latest
  permissions:
    contents: read
  needs:
    - build-frontend
    - build-backend
  services:
    postgres:
      image: postgres:18.4-alpine
      env:
        POSTGRES_DB: threatsea_test
        POSTGRES_USER: user
        POSTGRES_PASSWORD: user
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
      ports:
        - 5432:5432
  env:
    NODE_ENV: development
    JWT_SECRET: test-secret
    EXPRESS_SESSION_SECRET: test-session-secret
    AUTH_METHOD: fixed
    ORIGIN_APP: http://localhost:3000
    ORIGIN_BACKEND: http://localhost:8000
    DATABASE_USER: user
    DATABASE_PASSWORD: user
    DATABASE_NAME: threatsea_test
    DATABASE_HOST: localhost
    DATABASE_TLS: disabled
    COOKIES_SECURE_OPTION: disabled
    LOG_LEVEL: 0
    API_URI: http://localhost:8000
  steps:
    - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6
      with:
        lfs: true
    - uses: ./.github/actions/repository-setup

    - name: Install Playwright browsers
      run: pnpm --filter threatsea_fe exec playwright install --with-deps chromium

    - name: Apply DB migrations
      run: pnpm --filter threatsea_be db:migrate

    - name: Start backend
      run: pnpm --filter threatsea_be dev &

    - name: Wait for backend
      run: npx wait-on http://localhost:8000/api/health

    - name: Run Playwright tests
      run: pnpm --filter threatsea_fe playwright
      env:
        CI: "true"

    - name: Upload Playwright HTML report
      if: always()
      uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7
      with:
        name: playwright-report
        path: apps/frontend/playwright-report/
        retention-days: 14

    - name: Upload Playwright test results (traces, screenshots, videos)
      if: failure()
      uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7
      with:
        name: playwright-test-results
        path: apps/frontend/test-results/
        retention-days: 7
```

Notes:

- Pinned action SHAs match the existing workflow style.
- Chromium-only on CI by default — keeps wall-clock under control. Set `PW_ALL_BROWSERS=1` for nightly all-browser runs.
- `CI: "true"` activates Playwright's `retries: 2` and `forbidOnly: true`.
- The frontend dev server is started by Playwright itself via `webServer` in `playwright.config.ts` (no separate step needed).

### 8.5 Reporting

| Output                      | Where it lives                                                      | Retention |
| --------------------------- | ------------------------------------------------------------------- | --------- |
| HTML report                 | GitHub Actions artifact `playwright-report`                         | 14 days   |
| Traces, screenshots, videos | GitHub Actions artifact `playwright-test-results` (on failure only) | 7 days    |
| Status check on PR          | "E2E Frontend (Playwright)" check                                   | permanent |

To view a failing run: download `playwright-report`, unzip, open `index.html`. For traces, download `playwright-test-results` and use `npx playwright show-trace path/to/trace.zip`.

### 8.6 Branch protection (recommended)

For `main` and `next`:

- ✅ Required check: `E2E Frontend (Playwright)`
- ✅ Required check: `Test Frontend (Component Tests)` (already configured)
- ✅ At least one approval before merge
- ✅ Branch must be up-to-date with target

### 8.7 Rollout plan

1. **Open PR adding the `e2e-frontend` job** (non-blocking — not yet required to pass).
2. **Run for a week**, observe stability. Quarantine any flaky tests with `test.fixme()` and open tickets.
3. **Make the check required** on `main` and `next` once the flake rate is < 5%.
4. **Add nightly all-browser run** (optional follow-up) on a scheduled workflow with `PW_ALL_BROWSERS=1`.

---

## 9. Stability & Maintenance

### 9.1 Flake prevention

| Rule                                                            | Why                                 |
| --------------------------------------------------------------- | ----------------------------------- |
| Always use `data-testid` for E2E locators                       | Stable against styling changes      |
| Always use auto-waiting locators or `expect(...).toBeVisible()` | Removes timing flakes               |
| Never `page.waitForTimeout(...)`                                | Hard waits are flaky and slow       |
| One test = one observable behavior                              | Easier to debug failures            |
| Always namespace test resources with `buildTestId(...)`         | Tests don't collide with each other |
| Always clean up in `afterEach`                                  | Independent reruns                  |

### 9.2 When a test becomes flaky

1. **Quarantine immediately:** mark with `test.fixme(...)` and reference a tracking issue in a comment.
2. **Open an issue** with: failing test name, last 3 reports, screenshot, trace.
3. **Investigate root cause** — never just add retries. Common causes: missing API cleanup, race with toast notifications, dependency on test order, dynamic data without seeding.
4. **Fix and unquarantine.** Sprint review goes over remaining `fixme` tests.

**Worked example (`risk.page.e2e.spec.ts`), including a case that almost became a bug report it
shouldn't have been:** while writing the Risk suite, two scenarios failed consistently and were
both investigated to a confirmed conclusion before reporting anything:

- A validation check ("select a measure before applying it") failed reliably under Playwright but
  could not be reproduced manually in two browsers or by the dev team. Root cause: React's
  `<StrictMode>` (development builds only, a no-op in production) exposed a latent double field
  registration in the component only for automation's faster-than-human interaction timing. Not a
  real bug — confirmed by temporarily removing `<StrictMode>` locally and watching the test pass.
  Kept as `test.fixme` purely as a low-priority code-smell pointer, **not** reported as a bug.
- A line-of-tolerance permission check also failed reliably, and this time reproduced manually too
  (a real frontend/backend role mismatch, unrelated to StrictMode or automation). Reported to the
  dev team as a real bug and kept as `test.fixme` with the intended (currently unmet) behavior as
  the assertion, ready to un-skip once fixed.

The lesson: a consistently-failing automated test is evidence to investigate, not proof of a bug
by itself — cross-check with a manual repro (and, if in doubt, a deployed environment) before
reporting anything.

### 9.3 Maintenance cadence

| Cadence     | Activity                                                                          |
| ----------- | --------------------------------------------------------------------------------- |
| Per PR      | New feature → new tests; modified feature → updated tests                         |
| Weekly      | Review CI failure trend; quarantine flakes                                        |
| Per sprint  | Triage all `test.fixme` items                                                     |
| Per quarter | Page Object refactor pass (remove unused locators, consolidate duplicate methods) |

### 9.4 Performance targets

- E2E suite (Chromium, 1 worker, with retries) on CI: **< 15 minutes**.
- Component test suite on CI: **< 3 minutes**.

If the E2E suite grows beyond budget: enable Playwright sharding (`--shard=1/N`) across parallel jobs.

### 9.5 Ownership

| Area                                   | Owner                                | Backup    |
| -------------------------------------- | ------------------------------------ | --------- |
| Component tests (Vitest)               | Katharina                            | Yassine   |
| Page Objects + E2E specs               | Yassine                              | Katharina |
| CI workflow (`ci.yml`)                 | Yassine                              | —         |
| Test fixtures / builders / API helpers | Yassine (shared with team)           | Katharina |
| This document                          | Yassine (owner), updates from anyone | —         |

---

## 10. Quick Start (Day 1)

```bash
# 0. Prerequisites: node (see .node-version), pnpm, docker
git clone git@github.com:MaibornWolff/ThreatSea.git
cd ThreatSea
pnpm install

# 1. Database
docker compose up -d postgres

# 2. Backend (separate terminal)
pnpm dev --filter=threatsea_be

# 3. Install Playwright browsers (once per machine)
pnpm --filter threatsea_fe playwright:init

# 4. Run component tests
pnpm --filter threatsea_fe test:unit:watch

# 5. Run E2E tests in UI mode
pnpm --filter threatsea_fe playwright:ui
```

**Read in this order on day one**

1. This document (sections 1–7).
2. `apps/frontend/playwright/pages/base.page.ts` (12 lines, sets the pattern).
3. `apps/frontend/playwright/pages/projects.page.ts` (a representative page object).
4. `apps/frontend/playwright/tests/projects.page.e2e.spec.ts` (a representative spec).
5. `AGENTS.md` (project-wide rules).
6. `README.md` (project overview).

**Contacts**

| Topic                                      | Contact   |
| ------------------------------------------ | --------- |
| Component tests, Vitest, Testing Library   | Katharina |
| Playwright, POM, CI, fixtures, API helpers | Yassine   |
| Anything else                              | Team chat |

---

## 11. Glossary

| Term               | Meaning                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **POM**            | Page Object Model — pattern that encapsulates page selectors and actions into a class                                      |
| **`data-testid`**  | HTML attribute used as a stable selector hook for tests                                                                    |
| **`buildTestId`**  | Helper that combines `browserName` + Playwright's per-test `testId` into a unique resource namespace                       |
| **Storage state**  | Playwright's mechanism for persisting cookies + localStorage between tests (used here to skip the login flow)              |
| **CSRF token**     | Anti-forgery token stored in `localStorage` after login; API helpers read it via `getCsrfToken()`                          |
| **Trace**          | Playwright artifact (`*.zip`) containing screenshots, DOM snapshots, network logs and console output for a single test run |
| **Vitest globals** | `describe`, `it`, `expect`, `vi` etc. exposed without imports because `globals: true` in `vitest.config.ts`                |

---

## Changelog

| Date       | Version | Author  | Change                                                                            |
| ---------- | ------- | ------- | --------------------------------------------------------------------------------- |
| 2026-05-29 | 1.0     | Yassine | Initial documentation after POM migration; CI integration plan                    |
| 2026-09-04 | 1.1     | Yassine | Refreshed suite counts; added sections 5.8 and the 9.2 worked example (see below) |

Suites that landed between the two updates above, each following the POM pattern from day one:
Editor drawing (06-18), Connection editing (07-14), Report (06-25), Footer links (08-18), Members
(08-27), Risk (09-04).

---

> Single source of truth for the ThreatSea test setup. Update **this file** when anything in the test system changes.
