# Development Setup

## Setting up

- Clone the repo `git clone git@github.com:OmniOMR/mung-studio.git`
- Install npm packages from the lock file `npm ci`


## New feature development

- Bump the version in `package.json` and add the `-dev` suffix (e.g. `1.2.3-dev`)
- Modify the codebase as needed

Before commit:

- Run linter and prettier
- TODO: Linter needs setting up

```bash
# run linter and formatter
npm run lint
npm run prettier-write

# also try building for production,
# because parcel production is more strict and may fail
# even if development compiled fine:
npm run build
```

Commit and push changes to the Github repository.


## Developing the pyodide python logic

Parcel is set up to automatically bundle python scripts in the `/pyodide` folder into a ZIP file, which is then downloaded by the MuNG Studio during runtime and is loaded by the python pyodide environment. Parcel is NOT configured to detect file additions and deletions, it must be restarted whenever you do that. Other than that, you can simply modify a python script and Parcel will automarically rebundle. Then you reload the browser and the updated script is ready to be tested.

The `mung` package is just the clone of its repository. It is clonned when running `npm ci` in the `scripts/postinstall.js` script. To develop it withing this project, just delete the folder, git clone it manually and open it in a separate code editor from its root folder. Parcel does not care where the files come from, as long as they are there.

The `mstudio` package is part of this repository, but it's better to open it as a standalone python project in VS Code or Pycharm so that intelisense any mypy all work fine, because they need the proper project root folder. See the [README](../pyodide/mstudio/README.md) there to learn more.


## Deploying new version to Github

- Update the version in `package.json`, remove the `-dev` suffix.
- Check that the application works as expected.
- Build the production version `npm run build` and check no errors.
- Commit this change with the version as the commit message (e.g. `v1.2.3`).
- Create a release on Github with the same name as the version (e.g. `v1.2.3`).


## Deploying MuNG Studio to a web server

- Set up the `.env` configuration from `.env.example`
- Compile `npm run build`
- Copy the `dist` folder to the web server


## Deploying Simple PHP Backend

See the [Simple PHP Backend](simple-php-backend.md) documentation page.
