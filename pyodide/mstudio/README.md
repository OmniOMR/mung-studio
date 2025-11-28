# `mstudio` python package

This package serves as the bridge between the `mung` package and MuNG Studio.
It can be imported by pyodide and used from javascript.

To develop this package, open terminal in this folder and execute:

```
make setup
```

This creates a virtual environment and installs the `mung` package in the same
version that is cloned next-doors into the `mung` folder. The version is
defined in the root `package.json` file. Symlinks and installing via `-e` didn't
work with VS Code's Pylance checker.

Now you just open any of the python files in VS Code and set the interpreter
path into the newly created virtual environment at:

```
pyodide/mstudio/.venv/bin/python
```

To re-clone the mung package when changing its version in `package.json`,
run this command from the root:

```
npm run postinstall
```

And then re-run the `make setup` command.


## Development in web-browser

The parcel bundler in the MuNG Studio repository is set up to observe these python files and whenever they change, it rebundles it in a zip archive and when you refresh the browser, those modified files are already available. Just note that parcel is not set up to handle file additions/removals, in that case you have to restart it so that it registers the new file and does not crash on a missing removed file. In other words, when Parcel complains, restart it.
