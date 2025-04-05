# MuNG Studio

Try MuNG Studio at: https://ufallab.ms.mff.cuni.cz/~mayer/mung-studio

The MuNG format: https://github.com/OMR-Research/mung

The MUSCIMA++ v2.0 dataset: https://github.com/OMR-Research/muscima-pp/releases/tag/v2.0


## Documentation

- [Performance bottlenecks](docs/performance-bottlenecks.md)
- [Simple PHP backend](docs/simple-php-backend.md)


## Before comitting changes

```bash
# run linter and formatter
npm run lint
npm run prettier-write

# also try building for production,
# because parcel production is more strict and may fail
# even if development compiled fine:
npm run clean
npm run build
```

NOTE: Linter needs setting up...
