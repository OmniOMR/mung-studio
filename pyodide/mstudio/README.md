# `mstudio` python package

This package serves as the bridge between the `mung` package and MuNG Studio.
It can be imported by pyodide and used from javascript.

To develop this package, open VS Code in this folder and execute:

```
make setup
```

This creates a virtual environment and installs the `mung` package that sits
next doors via the `-e` flag so that you have all the type hints in place.


## Development in web-browser

The parcel bundler in the MuNG Studio repository is set up to observe these python files and whenever they change, it rebundles it in a zip archive and when you refresh the browser, those modified files are already available. Just note that parcel is not set up to handle file additions/removals, in that case you have to restart it so that it registers the new file and does not crash on a missing removed file. In other words, when Parcel complains, restart it.
