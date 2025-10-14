# Contributing

Thank you for your interest in contributing! This guide outlines how to contribute effectively and how we work in this project.

---

## Ways to Contribute

- Report bugs
- Propose enhancements or new features
- Implement user stories
- Fix bugs and improve tests
- Improve code quality
- Improve documentation
- Create or update examples and tutorials

If you’re unsure where to start, look for issues labeled:

- good first issue
- help wanted

---

## Getting Started

1. Fork the repository on GitHub.
2. Create a feature/bugfix branch locally:
   - Git: git checkout -b feature/your-name-description
3. Install project dependencies from the monorepo root:
   - pnpm install
4. Run the project locally and verify the baseline tests pass.

If you’re unsure about any step, open an issue and ask for guidance.

Notes for a monorepo:

- This repository is a monorepo with apps/backend (Node.js Express) and apps/frontend (React).
- Use pnpm workspaces and turborepo to manage builds, tests, and linting across packages.

---

## Environment and Tools

- Node.js version:
  - The required Node.js version is specified in the [.node-version](.node-version) file.
  - We recommend to use a Node version manager (e.g., nvm, asdf, Volta) to ensure you’re using the correct version.
- pnpm version:
  - The required pnpm version is specified in [package.json](package.json).
- Turborepo:
  - Used to orchestrate tasks (build, test, lint) across apps/packages.
- Other tools:
  - As specified by each app (e.g., ESLint, Prettier, TypeScript, etc.).
- Editors/IDEs:
  - Any you prefer, but please keep project-specific editor configs in place if present.
- How to run tasks:
  - Use root-level commands via pnpm -w (or pnpm --workspace-root) to run workspaces-wide tasks.
  - Use Turbo filters to target specific apps or packages (e.g., turbo run build --filter "..../frontend", turbo run test --filter "..../backend").

---

## Repository Structure

- /apps
  - /backend — Node.js Express backend
  - /frontend — React frontend
- /packages
  - /eslint-config — shared ESLint configuration
  - /typescript-config — shared TypeScript configuration

Root-level and common files:

- pnpm-workspace.yaml — workspace manifest for pnpm
- turbo.json — Turbo configuration

---

## Branching and Workflow

- main: production-ready state
- next: development branch for new features and bug fixes
- feature/xyz: short-lived branches for new features
- bugfix/xyz: short-lived branches for fixes
- hotfix/xyz: urgent fixes in production

Workflow:

1. Create a new branch from the main/next branch.
2. Commit changes with clear messages following [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/).
3. Open a pull request against the target branch.
4. Address feedback, refine, and merge when ready.
5. Ensure tests and CI pass before merging.

---

## Issues and Enhancements

- Before opening, search the issue tracker to avoid duplicates.
- Include a clear title and a detailed description.
- For bugs, provide steps to reproduce, expected vs. actual behavior, environment details, and logs.
- Attach minimal reproducible examples when possible (e.g., a small repo or snippet).
- Label using our standard labels (bug, enhancement, documentation, etc.).

---

## Proposing Changes (Pull Requests)

PR guidelines:

- One logical change per PR whenever feasible.
- Follow the given template when opening the PR.
- Include a concise but descriptive title and a detailed description.
- Reference related issues or tickets (e.g., Closes #123).
- Include what tests were added or updated.
- Ensure the code passes all tests and linters.
- Update documentation if applicable.
- Provide screenshots or example outputs for UI changes when relevant.

PR Checklist:

- [ ] Code adheres to style guidelines
- [ ] Tests updated or added
- [ ] Documentation updated
- [ ] Local tests pass
- [ ] CI checks green
- [ ] Reviewers requested (tag appropriate teams)

---

## Commit Message Guidelines

We use Conventional Commits format. This provides a standardized way to describe changes.

Format:
`<type>(<scope>): <subject>`

Types:

- feat: a new feature
- fix: a bug fix
- docs: documentation changes
- style: formatting, missing semi-colons, etc.
- refactor: code changes that do not alter behavior
- test: adding or modifying tests
- perf: performance improvements
- chore: build, tooling, or other changes
- build: changes to the build system or dependencies
- ci: CI configuration and scripts
- revert: revert a previous commit

Subject:

- Use the imperative mood (e.g., "add", "fix", "update").
- Short and descriptive (recommended max 50 characters).

Scope:

- Optional but encouraged for clarity (e.g., auth, ui, api or ticket number).

Examples:

- feat(auth): add OAuth2 login flow
- fix(ui): correct button alignment on mobile
- docs(readme): clarify contribution guidelines
- perf(cache): improve cache eviction strategy
- chore(deps): update dependencies to latest

Breaking changes:

- Indicate breaking changes with "!" after the type and scope, e.g., feat!: drop support for old API
- Or indicate in the body/footer with "BREAKING CHANGE: ..."

Body:

- If present, provide a concise explanation of the motivation and a more detailed description of the change.
- Include any migration notes or impact on users.

Footer (optional):

- References to issues (e.g., Closes #123) can be included here.

Guidelines:

- No period at the end of the subject line.
- Wrap body lines at about 72 characters.
- Ensure every commit clearly communicates what changed and why.

---

## Testing

- Run tests for a specific app:
  - Frontend: pnpm -w run test:e2e --filter threatsea_fe (running backend has to be available)
  - Backend: pnpm -w run test --filter threatsea_be

---

## Linting and Formatting

- Lint and format code before submitting:
  - Lint: pnpm -w lint
  - Format: pnpm -w format
- If your changes touch APIs or public interfaces, update type definitions and documentation accordingly.

---

## Documentation

- Update or create documentation for new features or changes.
- Document **every** decision in Github issues that you take during their realization. 
- Ensure examples are accurate and minimal but representative.
- Keep sentence structure short and simple.
- Include illustrations like screenshots or add additional information like code snippets whenever helpful.
- Update API references, if applicable.
- Document any breaking changes and migration notes.
- Whenever a feature adds/removes UI elements or changes a UI flow, update the [user manual](https://maibornwolff.github.io/ThreatSea/User%20Manual/).
- Decisions that have an impact on several features or the whole architecture can be taken over into the [ADR](https://maibornwolff.github.io/ThreatSea/Technical%20Documentation/Architectural%20Decision%20Record.md). 

---

## Security and Disclosure

- If you discover a security vulnerability, follow responsible disclosure guidelines.
- Do not publish vulnerability details publicly before coordinated disclosure.
- Contact the designated security contact or use the project's disclosure channel.

---

## Contact and Help

- If you have questions, ask in the discussions tab on GitHub.
- For urgent matters, contact the maintainers

---

Thank you for contributing! Your effort helps the project grow and improves the experience for all users.
