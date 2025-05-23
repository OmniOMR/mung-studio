const { Transformer } = require("@parcel/plugin");
const path = require("path");
const { glob } = require("glob");

module.exports.default = new Transformer({
  async transform({ asset, options, logger }) {
    // we are transforming the "pyodide-packages" file, which acts as the
    // target for parcel to create the zip with .py files. The type of this
    // asset is the name of the target file.
    asset.type = "pyodide-packages";

    // get the directory path that contains the "pyodide-packages" file
    // that we are currently transforming, because all URL dependencies
    // are paths that are relative to this directory
    const pyodideDirectory = path.dirname(asset.filePath);

    // Get relative paths to all .py files in the directory, so that they
    // can serve as dependencies and trigger re-bundling of the zip archive 
    let relativeDependencyPaths = (await glob(
      path.join(pyodideDirectory, "**/*.py")
    )).map(p => path.relative(
      pyodideDirectory, p
    ));

    // Add these .py files as dependencies, so that the zip arcive is rebuild
    // whenever any of these files change.
    relativeDependencyPaths.map(p => {
      asset.addDependency({
        specifier: p,
        specifierType: "url",
        bundleBehavior: "inline",
      })
    });
    
    return [asset];
  }
});