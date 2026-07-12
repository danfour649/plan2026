import { spawn } from "node:child_process";
import * as esbuild from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const srcRoot = resolve(root, "../../src");

const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  alias: {
    "@": srcRoot,
    "@api": resolve(root, "src"),
  },
  packages: "external",
  logLevel: "info",
};

const watch = process.argv.includes("--watch");

async function bundleAll() {
  await Promise.all([
    esbuild.build({
      ...shared,
      entryPoints: [resolve(root, "src/dev-server.ts")],
      outfile: resolve(root, "dist/dev-server.js"),
    }),
    esbuild.build({
      ...shared,
      entryPoints: [resolve(root, "src/vercel-entry.ts")],
      outfile: resolve(root, "api/index.js"),
    }),
  ]);
}

if (watch) {
  let child;
  const startServer = () => {
    child?.kill();
    child = spawn("node", [resolve(root, "dist/dev-server.js")], {
      stdio: "inherit",
      env: process.env,
    });
  };

  const devCtx = await esbuild.context({
    ...shared,
    entryPoints: [resolve(root, "src/dev-server.ts")],
    outfile: resolve(root, "dist/dev-server.js"),
    plugins: [
      {
        name: "restart-dev-server",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) startServer();
          });
        },
      },
    ],
  });

  const apiCtx = await esbuild.context({
    ...shared,
    entryPoints: [resolve(root, "src/vercel-entry.ts")],
    outfile: resolve(root, "api/index.js"),
  });

  await Promise.all([devCtx.watch(), apiCtx.watch()]);
  console.log("API bundle watch started");
} else {
  await bundleAll();
}
