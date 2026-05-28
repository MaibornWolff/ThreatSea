# AGENTS.md

Instructions for AI coding agents (Codex, Claude Code, Cursor, Aider, Copilot, Windsurf, Zed, Jules, and others) working in this repository. This file complements `README.md` (humans, getting started) and `CONTRIBUTING.md` (humans, contributing process); read both first.

Format: [agents.md](https://agents.md/). Agents in subdirectories should prefer a nested `AGENTS.md` over this one if present.

---

## Project Overview

ThreatSea is an open-source threat modeling tool by [MaibornWolff GmbH](https://www.maibornwolff.de/en), implementing the 4x6 methodology. BSD-3-Clause licensed.

Monorepo composed of a React frontend (the threat-model editor) and an Express backend (auth, persistence, real-time sync).

---

## Repository Layout

```text
apps/
  frontend/           React 19 + TypeScript app (Vite, react-konva canvas editor)
  backend/            Express 5 + TypeScript API (Drizzle ORM, PostgreSQL, socket.io)
packages/
  typescript-config/  Shared tsconfig presets
gh-pages/             Published documentation sources (rendered via mkdocs; see mkdocs.yml)
```

### Frontend structure (`apps/frontend/src/`)

```text
api/             One file per backend resource (*.api.ts)
application/     Redux Toolkit state
  actions/         Action creators / async thunks
  reducers/        Slices (createSlice)
  selectors/       Memoized selectors (reselect)
  middlewares/     Custom Redux middleware
  adapters/        API <-> store shape transformations
  hooks/           App-level hooks (useAppDispatch, useAppSelector)
  store.ts         configureStore
view/            Presentation layer
  pages/           Route-level components
  components/      Reusable UI; `editor-components/` is the Konva canvas editor
  dialogs/         Modals
  wrappers/        Layout wrappers
  report/          PDF report generation (@react-pdf/renderer)
hooks/           Shared custom hooks
translations/    i18next bundles (`en/`, `de/`) — every user-facing string needs both
types/           Shared TypeScript types
utils/           Utility functions
```

### Backend structure (`apps/backend/src/`)

Express routers, Drizzle schema/migrations under `apps/backend/drizzle/`, openid-client for auth, socket.io for real-time editor sync.

---

## Tech Stack

| Area            | Tooling                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Package manager | pnpm workspaces + Turborepo                                                                              |
| Frontend        | React 19, TypeScript, Vite 8, MUI v9, Redux Toolkit, react-konva, react-hook-form, i18next, react-router |
| Backend         | Express 5, TypeScript, Drizzle ORM, PostgreSQL (`pg`), openid-client, socket.io                          |
| Lint / Format   | oxlint, oxfmt                                                                                            |
| Tests           | Vitest (unit), Playwright (E2E, frontend only)                                                           |
| Git hooks       | husky + lint-staged                                                                                      |
| Release         | semantic-release + Conventional Commits                                                                  |

Node version is pinned in `.node-version`; pnpm version in `package.json` `packageManager`.

---

## Common Commands

Run from the repo root unless noted. Most tasks delegate through Turborepo.

```bash
pnpm install                              # install all workspaces
pnpm dev                                  # run frontend + backend together
pnpm build                                # build all workspaces
pnpm test                                 # unit tests (Vitest) across workspaces
pnpm lint                                 # oxlint across workspaces
pnpm lint:fix                             # oxlint --fix
pnpm format                               # oxfmt --write .
pnpm format:check                         # verify formatting (CI uses this)
pnpm type-check                           # tsc --noEmit across workspaces

# Workspace-scoped
pnpm --filter threatsea_fe test:unit      # frontend unit tests
pnpm --filter threatsea_fe type-check
pnpm --filter threatsea_be test           # backend unit tests
pnpm --filter threatsea_be db:generate    # generate a new Drizzle migration
pnpm --filter threatsea_be db:migrate     # apply migrations

# E2E (requires DB + backend running — see README)
pnpm --filter threatsea_fe playwright
```

Before opening a PR, run at minimum: `pnpm lint`, `pnpm format:check`, `pnpm type-check`, `pnpm test`.

---

## Code Style & Conventions

- **Match nearby code.** Before writing new code, read 1–2 similar files in the same directory and follow their patterns (naming, file structure, imports, styling approach). Convention consistency outweighs personal preference. If a local convention clearly conflicts with widely accepted community best practice, flag it explicitly (what the repo does, what the community recommends, why it matters) rather than silently following.
- **TypeScript everywhere.** No new `.js` source files in `apps/`.
- **Frontend styling.** MUI v9 with the `sx` prop; no CSS-in-JS files unless extending a theme.
- **State.** Redux Toolkit, but **not** the `createSlice` pattern. Reducers live in `application/reducers/*.reducer.ts` and use `createReducer`. Actions live separately in `application/actions/*.actions.ts` as static class members composed of `createAction` + `createAsyncThunk`. Selectors are memoized via `reselect` in `application/selectors/`. RTK Query is **not** used. When extending state, follow this split — do not introduce slices.
- **i18n.** All user-facing strings use `useTranslation` / `t("…")` keys. Every new key must exist in both `translations/en/` and `translations/de/`.
- **File naming (target convention).** Frontend components follow `<name>.component.tsx`, tests `<name>.component.test.tsx`, hooks `use-<name>.hook.ts`, reducers `<name>.reducer.ts`, selectors `<name>.selectors.ts`, actions `<name>.actions.ts`, API clients `<name>.api.ts`.
- **Imports.** Both workspaces alias `#*` to `./src/*` via `package.json#imports` — prefer this over deep relative paths.
- **Comments.** Default to none. Identifiers should be self-explanatory. Add a one-line comment only when the _why_ is non-obvious (a workaround, an invariant, a subtle constraint). Do not narrate _what_ the code does.
- **Scope discipline.** Don't refactor unrelated code, don't add error handling for impossible cases, don't introduce abstractions for hypothetical future requirements. Three similar lines beat a premature abstraction.
- **Open-source lens.** When making structural decisions, weigh contributor discoverability and onboarding friction. Prefer obvious over clever; new contributors should be able to follow the trail without insider knowledge.

---

## Testing

Project-wide rules:

- **Vitest globals are enabled** (`globals: true` in both `vitest.config.ts` files). **Do not import** `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll` from `"vitest"` in new test files — they are available as globals. The only legitimate `"vitest"` import is for types (e.g. `MockInstance`). Existing files that import them are legacy; match the new convention.
- **Test behavior, not implementation.** Assertions verify a function's contract: inputs (arguments, config) → outputs (return values, side effects, errors). Never assert on internal mechanisms (e.g. which formatter options were passed, which private helper was called) — assert on observable output only. If a refactor that preserves the contract would break the test, the test is too coupled.
- **Meaningful assertions.** Reject "does not throw" / "is defined" as the only assertion. Verify specific values, return shapes, or observable behavior.
- **Cover edge cases.** Empty inputs, null/undefined, boundary values, error paths — not only the happy path.
- **Frontend tests** live next to the component (`<name>.component.test.tsx`) and use `@testing-library/react` + `@testing-library/user-event`.
- **Backend tests** live in `apps/backend/tests/` or alongside source as `<name>.test.ts`.
- **E2E (Playwright)** uses the Page Object Model under `apps/frontend/playwright/`. See `README.md` for the running-services prerequisites.

### Reviewing AI-generated tests

AI-generated tests often _look_ correct but contain subtle issues. Both the authoring agent and the human reviewer should verify:

1. **Meaningful assertions.** Reject tests that only check "doesn't throw" or "is defined". Assertions must validate specific values, return shapes, or observable behavior.
2. **Behavior over implementation.** Flag over-mocking. If a test mocks every dependency and asserts on internal method calls, it's brittle and will break on any refactor.
3. **Actually run the tests.** Execute `vitest run` (or the workspace-scoped equivalent) before submitting. AI-generated tests can have import errors, reference nonexistent functions, or misuse APIs while still looking valid.
4. **Real edge cases.** AI gravitates toward happy-path scenarios. Explicitly check: empty inputs, null/undefined, failed network requests, empty collections, boundary values.

Treat AI test output as a draft requiring human review, not production-ready code.

---

## Commit & Branch Workflow

Follow `CONTRIBUTING.md`. Short version:

- **Branches**: `feature/<slug>`, `bugfix/<slug>`, `hotfix/<slug>`. `next` is the integration branch, `main` is production. See `CONTRIBUTING.md` for the branching workflow.
- **Commits**: Conventional Commits (`<type>(<scope>): <subject>`). Imperative mood, no trailing period, subject ≤ 50 chars where practical. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `perf`, `chore`, `build`, `ci`, `revert`. `feat!`/`fix!` or `BREAKING CHANGE:` footer for breakage.
- **One logical change per PR.** Reference issues in the description (`Closes #123`).
- Releases are automated by semantic-release on merge to `main` based on commit types — write your subject lines accordingly.

---

## Files Not to Hand-Edit

These are generated, sensitive, or otherwise drift-prone. Modify the source, not the artifact:

| Path                                                                                      | Why                      | Correct action                                                           |
| ----------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `apps/backend/drizzle/migrations/**`                                                      | Generated from schema    | `pnpm --filter threatsea_be db:generate` after editing schema            |
| `pnpm-lock.yaml`                                                                          | Produced by pnpm         | Edit `package.json`, run `pnpm install`                                  |
| `**/.env`, `**/.env.*`                                                                    | Secrets, never committed | Add to local env only; document new vars in `.env.example` if one exists |
| `apps/frontend/dist/`, `apps/backend/dist/`, `.turbo/`, `coverage/`, `playwright-report/` | Build/test output        | Regenerate via the relevant build/test command                           |

Treat any file generated by a tool the same way — regenerate, don't patch.

---

## Security Considerations

- Never commit secrets, tokens, or credentials. Use `.env` files locally.
- Authentication has two modes, selected by the `AUTH_METHOD` env var (see `apps/backend/src/config/config.ts`): `oidc` (real OIDC via `openid-client`, implemented in `oidcAuthentication.service.ts`) and the default fixed-profile mode (`fixedAuthentication.service.ts`, used for local dev and E2E with hardcoded test users). Don't add a third "bypass" path; use the existing modes.
- Backend uses `helmet`, `express-rate-limit`, CSRF protection (`csrf-sync`), and `cookie-parser`. Don't remove these middlewares without reviewing the security impact.
- Report vulnerabilities per `SECURITY.md` — do not open public issues for security bugs.

---

## AI Tool Integrations

This repository ships optional configurations for specific AI tools. They are convenience layers — everything an agent needs is in this file.

- **Claude Code** users: see `CLAUDE.md` and the `.claude/` directory (skills, subagents, hook configuration).
- **Cursor / Aider / Continue / Windsurf / Zed / others**: tool-specific configs (`.cursor/`, `.aider.conf.yml`, `.continue/`, `.windsurfrules`, `.zed/`) are welcome via PR. Keep them as thin pointers to this file — don't duplicate content.

Universal safety nets (apply regardless of which tool produced a change):

- `.husky/pre-commit` + `lint-staged` enforce formatting on every commit.
- CI (`.github/workflows/ci.yml`) runs lint, format check, type-check, and tests on every PR.
- `.editorconfig` keeps editor-level basics consistent.

If an AI tool you use is missing a config, open a PR adding it — keep it thin and consistent with the principles in this file.
