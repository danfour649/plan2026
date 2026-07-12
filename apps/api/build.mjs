import { execFileSync, spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

async function writeVercelOutput(apiBundlePath) {
  const outRoot = resolve(root, ".vercel/output");
  const funcDir = resolve(outRoot, "functions/api.func");
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));

  await rm(outRoot, { recursive: true, force: true });
  await mkdir(funcDir, { recursive: true });
  await mkdir(resolve(outRoot, "static"), { recursive: true });

  await cp(apiBundlePath, resolve(funcDir, "index.js"));

  // Vercel Build Output API does not always install function deps; install here.
  await writeFile(
    resolve(funcDir, "package.json"),
    `${JSON.stringify(
      {
        type: "module",
        dependencies: pkg.dependencies ?? {},
      },
      null,
      2,
    )}\n`,
  );
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npm, ["install", "--omit=dev", "--no-fund", "--no-audit"], {
    cwd: funcDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  await writeFile(
    resolve(funcDir, ".vc-config.json"),
    `${JSON.stringify(
      {
        runtime: "nodejs22.x",
        handler: "index.js",
        launcherType: "Nodejs",
        shouldAddHelpers: false,
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    resolve(outRoot, "config.json"),
    `${JSON.stringify(
      {
        version: 3,
        routes: [{ src: "/(.*)", dest: "/api" }],
      },
      null,
      2,
    )}\n`,
  );

  console.log("Wrote Vercel Build Output API to .vercel/output");
}

async function bundleAll() {
  const apiOutfile = resolve(root, "api/index.js");
  await Promise.all([
    esbuild.build({
      ...shared,
      entryPoints: [resolve(root, "src/dev-server.ts")],
      outfile: resolve(root, "dist/dev-server.js"),
    }),
    esbuild.build({
      ...shared,
      entryPoints: [resolve(root, "src/vercel-entry.ts")],
      outfile: apiOutfile,
    }),
  ]);
  await writeVercelOutput(apiOutfile);
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
