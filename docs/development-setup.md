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
