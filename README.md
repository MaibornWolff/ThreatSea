# ThreatSea

ThreatSea is a threat modeling tool developed by [MaibornWolff GmbH](https://www.maibornwolff.de/en), which implements the 4x6 methodology.
It provides a comprehensive framework for identifying and analyzing potential threats in software systems, helping organizations to implement effective security measures.

## Getting started

### Cloning

This repository uses [Git LFS](https://git-lfs.com/). Please make sure that it is available on your machine before cloning the repository.

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

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

ThreatSea is licensed under the [BSD-3-Clause License](LICENSE)

---

Made with ❤ by [MaibornWolff GmbH](https://www.maibornwolff.de/en) &nbsp;&middot;&nbsp; GitHub [@MaibornWolff](https://github.com/maibornwolff)
