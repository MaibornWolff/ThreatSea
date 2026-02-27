# ThreatSea

ThreatSea is a threat modeling tool developed by [MaibornWolff GmbH](https://www.maibornwolff.de/en), which implements the 4x6 methodology.
It provides a comprehensive framework for identifying and analyzing potential threats in software systems, helping organizations to implement effective security measures.

## Getting started

### Requirements

- [node.js](https://nodejs.org/) installation (you can find the currently used version of node.js in the [.node-version](.node-version) file)
- [pnpm package manager](https://pnpm.io/)
- PostgreSQL database

```bash
# Install dependencies
$ pnpm i
# Run ThreatSea locally in dev mode (in default configuration it will be served at http://localhost:3000)
$ pnpm run dev
```

## Get Involved

Do you have a **bug** or **feature request**? Please open [a new issue](https://github.com/MaibornWolff/ThreatSea/issues/new).
For any questions on how to use ThreatSea, please consult the documentation or join the [discussion](https://github.com/MaibornWolff/ThreatSea/discussions).
Feedback is always welcome.

### Contributing

Please see the [Contributing Guidelines](CONTRIBUTING.md) for more information on how to get involved in the project.

## Releases

ThreatSea uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and releases. Releases are automatically created when changes are pushed to the `main` or `next` branch, following [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Release Process

1. **Automatic Releases**: When code is pushed to `main` or `next` branch, the CI pipeline will:
   - Run all tests and quality checks
   - Analyze commit messages to determine the next version number
   - Create a GitHub release with release notes
   - Build and publish Docker container images to GitHub Container Registry

2. **Container Images**: The following Docker images are published:
   - `maibornwolff/threatsea:{ latest | release version }` - published on Docker Hub
   - `ghcr.io/maibornwolff/threatsea:{ latest | next | (pre-)release version }` - published on GitHub Container Registry (includes prerelease versions)

3. **Versioning**: Version numbers follow [Semantic Versioning](https://semver.org/):
   - `feat:` commits trigger a **minor** version bump
   - `fix:`, `perf:`, `revert:` commits trigger a **patch** version bump
   - Commits with `BREAKING CHANGE` in the footer trigger a **major** version bump

### Commit Message Format

Please use [Conventional Commits](https://www.conventionalcommits.org/) format for your commit messages:

```txt
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:

- `feat: add new threat analysis feature`
- `fix: resolve authentication issue`
- `docs: update installation guide`

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

ThreatSea is licensed under the [BSD-3-Clause License](LICENSE)

---

Made with ❤ by [MaibornWolff GmbH](https://www.maibornwolff.de/en) &nbsp;&middot;&nbsp; GitHub [@MaibornWolff](https://github.com/maibornwolff)
