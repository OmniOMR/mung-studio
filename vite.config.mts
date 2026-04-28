import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ViteYaml from '@modyfi/vite-plugin-yaml';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const pyodideRoot = path.resolve(projectRoot, "pyodide");
const pyodidePackagesZipPath = path.resolve(pyodideRoot, "pyodide-packages.zip");
const crossOriginIsolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

function createPyodidePackagesPlugin(): Plugin {
  let rebuildInFlight: Promise<void> | null = null;

  const buildArchive = async () => {
    fs.mkdirSync(pyodideRoot, { recursive: true });

    const archive = archiver("zip", {
      zlib: {
        level: 7,
      },
    });

    const archiveStream = fs.createWriteStream(pyodidePackagesZipPath);

    const archiveReady = new Promise<void>((resolve, reject) => {
      archiveStream.on("close", resolve);
      archiveStream.on("error", reject);
      archive.on("error", reject);
    });

    archive.pipe(archiveStream);
    archive.directory(path.resolve(pyodideRoot, "mung/mung"), "mung");
    archive.directory(path.resolve(pyodideRoot, "mung/mung2midi"), "mung2midi");
    archive.directory(path.resolve(pyodideRoot, "mung/mung2musicxml"), "mung2musicxml");
    archive.directory(path.resolve(pyodideRoot, "mstudio/mstudio"), "mstudio");

    await archive.finalize();
    await archiveReady;
  };

  const rebuildArchive = async () => {
    if (!rebuildInFlight) {
      rebuildInFlight = buildArchive().finally(() => {
        rebuildInFlight = null;
      });
    }

    return rebuildInFlight;
  };

  return {
    name: "pyodide-packages-archive",
    async buildStart() {
      await rebuildArchive();
    },
    configureServer(server) {
      const watchRoots = [path.resolve(pyodideRoot, "mung"), path.resolve(pyodideRoot, "mstudio")];

      server.watcher.add(watchRoots);

      const rebuildAndReload = async (filePath: string) => {
        if (!filePath.endsWith(".py")) {
          return;
        }

        await rebuildArchive();
        server.ws.send({
          type: "full-reload",
          path: "*",
        });
      };

      server.watcher.on("add", rebuildAndReload);
      server.watcher.on("change", rebuildAndReload);
      server.watcher.on("unlink", rebuildAndReload);
    },
  };
}

export default defineConfig({
  base: "./",
  envPrefix: ["VITE_", "SIMPLE_", "DATASET_"],
  plugins: [react(), createPyodidePackagesPlugin(), ViteYaml()],
  publicDir: "public",
  server: {
    port: 1234,
    headers: crossOriginIsolationHeaders,
  },
  preview: {
    port: 1234,
    headers: crossOriginIsolationHeaders,
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["onnxruntime-web", "react-scan", "pyodide"],
  },
});