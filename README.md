# MuNG Studio

Try MuNG Studio at: https://ufallab.ms.mff.cuni.cz/~mayer/mung-studio

The MuNG format: https://github.com/OMR-Research/mung

The MUSCIMA++ v2.0 dataset: https://github.com/OMR-Research/muscima-pp/releases/tag/v2.0


## Documentation

- [User Manual](docs/user-manual/user-manual.md)

Development documentation:

- [Folder structure](docs/folder-structure.md)
- [Architecture](docs/architecture.md)
- [Editor component](docs/editor-component.md)
- [Performance bottlenecks](docs/performance-bottlenecks.md)
- [Simple PHP backend](docs/simple-php-backend.md)
- [Pyodide Python Runtime](docs/pyodide-python-runtime.md)
- [WebGL Renderer](docs/webgl-renderer.md)
- [Development setup](docs/development-setup.md)


## Development

Start the development frontend server:

```bash
# install dependencies from package-lock.json
npm ci

# run the development server
npm start

# see the development preview at http://localhost:1234
```

Optionally start the simple PHP backend server in another terminal:

```bash
cd simple-php-backend
php -S localhost:8080

# NOTE: you need to have the .env file present with this line in it,
# otherwise the frontend will not know where to connect to:
SIMPLE_PHP_BACKEND_URL=http://localhost:8080
```

Read the [Development Setup](docs/development-setup.md) documentation page to see how to develop, debug, and deploy the project.
