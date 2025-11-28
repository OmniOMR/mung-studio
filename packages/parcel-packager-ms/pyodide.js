const { Packager } = require("@parcel/plugin");
const path = require("path");
const archiver = require("archiver");

module.exports.default = new Packager({
  async package({ bundle, bundleGraph, logger, options }) {
    // start building a zip archive
    const archive = archiver("zip", {
      zlib: {
        level: 7
      }
    });

    // --- PACKAGES BEGIN ---

    // include the mung python package(s)
    archive.directory(
      path.join(options.projectRoot, "pyodide/mung/mung/"),
      "mung"
    );
    archive.directory(
      path.join(options.projectRoot, "pyodide/mung/mung2midi/"),
      "mung2midi"
    );
    archive.directory(
      path.join(options.projectRoot, "pyodide/mung/mung2musicxml/"),
      "mung2musicxml"
    );

    // include the mstudio python package
    archive.directory(
      path.join(options.projectRoot, "pyodide/mstudio/mstudio/"),
      "mstudio"
    );

    // --- PACKAGES END ---

    // create the buffer and turn it into a buffer object
    archive.finalize();
    const zipBufferData = await streamToBuffer(archive); // type Buffer

    // return the buffer as the finished parcel bundle
    return {
      contents: zipBufferData,
      type: "zip",
    };
  }
});

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", err => reject(`error converting stream - ${err}`));
  });
}
