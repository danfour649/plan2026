#!/usr/bin/env node
/**
 * Squash all commits after a base into one commit using `git reset --soft`,
 * reusing the **first** (oldest) commit's full message in the squashed range.
 *
 * Usage (from repo root):
 *   node scripts/squash-soft.mjs
 *   node scripts/squash-soft.mjs --upstream origin/main
 *   node scripts/squash-soft.mjs --onto <commit-ish>
 *   node scripts/squash-soft.mjs --dry-run
 *
 * After squash, runs `git push --force-with-lease --no-verify` (skips pre-push hooks).
 *
 * Default base: merge-base of HEAD with origin/main, main, origin/master, or master
 * (first ref that exists). Use --upstream to pick another branch for merge-base.
 * Use --onto to soft-reset directly to that commit (no merge-base).
 *
 * Requires a clean working tree. Refuses if there is nothing to squash (0 commits
 * in range) or only one commit unless you pass --force-one.
 */

import { execFileSync, execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, options = {}) {
  const opts = { encoding: "utf8", stdio: options.quiet ? "pipe" : "inherit", ...options };
  return execSync(cmd, opts);
}

function runQuiet(cmd, options = {}) {
  return run(cmd, { quiet: true, ...options }).trim();
}

function repoRoot() {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  try {
    return runQuiet("git rev-parse --show-toplevel", { cwd: process.cwd() });
  } catch {
    return process.cwd();
  }
}

function parseArgs(argv) {
  const out = {
    dryRun: false,
    forceOne: false,
    upstream: null,
    onto: null,
    help: false,
    invalid: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force-one") out.forceOne = true;
    else if (a === "--upstream" || a === "-u") out.upstream = argv[++i];
    else if (a === "--onto" || a === "-o") out.onto = argv[++i];
    else if (a.startsWith("--upstream=")) out.upstream = a.slice("--upstream=".length);
    else if (a.startsWith("--onto=")) out.onto = a.slice("--onto=".length);
    else {
      console.error(`Unknown argument: ${a}`);
      out.invalid = true;
    }
  }
  return out;
}

function firstExistingRef(root, refs) {
  for (const r of refs) {
    try {
      runQuiet(`git rev-parse --verify ${r}`, { cwd: root });
      return r;
    } catch {
      /* try next */
    }
  }
  return null;
}

function resolveSquashBase(root, { upstream, onto }) {
  if (onto) {
    return runQuiet(`git rev-parse ${onto}`, { cwd: root });
  }
  const u = upstream ?? firstExistingRef(root, ["origin/main", "main", "origin/master", "master"]);
  if (!u) {
    throw new Error(
      "No default upstream (origin/main, main, …). Pass --upstream <ref> or --onto <commit>.",
    );
  }
  return runQuiet(`git merge-base HEAD ${u}`, { cwd: root });
}

function assertCleanWorktree(root) {
  const porcelain = runQuiet("git status --porcelain", { cwd: root });
  if (porcelain) {
    throw new Error(
      "Working tree is not clean. Commit, stash, or discard changes before squashing.",
    );
  }
}

function countCommitsInRange(root, base) {
  const n = runQuiet(`git rev-list --count ${base}..HEAD`, { cwd: root });
  return Number.parseInt(n, 10);
}

function firstCommitMessageInRange(root, base) {
  return runQuiet(`git log --reverse ${base}..HEAD -1 --format=%B`, { cwd: root });
}

function printHelp() {
  console.log(`squash-soft — soft reset squash, message from oldest commit in range

Usage:
  node scripts/squash-soft.mjs [options]

Options:
  --upstream, -u <ref>   merge-base(HEAD, ref) is the squash base (default: first of origin/main, main, …)
  --onto, -o <commit>     soft reset to this commit exactly
  --dry-run               show base, commit count, and message; do not reset or commit
  --force-one             allow squashing when only one commit sits on top of the base
  --help, -h              this text

Push uses --no-verify so pre-push (e.g. eslint/tsc) does not run again after the squash.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.invalid) {
    printHelp();
    process.exit(1);
  }
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (args.upstream && args.onto) {
    console.error("Use only one of --upstream and --onto.");
    process.exit(1);
  }

  const root = repoRoot();
  const execOpts = { cwd: root };

  if (!args.dryRun) assertCleanWorktree(root);

  let baseSha;
  try {
    baseSha = resolveSquashBase(root, args);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  const headSha = runQuiet("git rev-parse HEAD", execOpts);
  if (baseSha === headSha) {
    console.error("Nothing to squash: HEAD is the same as the squash base.");
    process.exit(1);
  }

  const n = countCommitsInRange(root, baseSha);
  if (n === 0) {
    console.error("Nothing to squash: no commits in range.");
    process.exit(1);
  }
  if (n === 1 && !args.forceOne) {
    console.error(
      "Only one commit on top of the base. Squash is a no-op unless you pass --force-one.",
    );
    process.exit(1);
  }

  const msg = firstCommitMessageInRange(root, baseSha);
  if (!msg.trim()) {
    console.error("First commit in range has an empty message; aborting.");
    process.exit(1);
  }

  const baseShort = runQuiet(`git rev-parse --short ${baseSha}`, execOpts);
  console.log(`Squash base: ${baseShort} (${n} commit(s) → 1)`);
  console.log("--- First commit message (will be reused) ---\n" + msg + "\n---");

  if (args.dryRun) {
    console.log("Dry run: no changes made.");
    return;
  }

  run(`git reset --soft ${baseSha}`, execOpts);

  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "squash-soft-")), "msg.txt");
  fs.writeFileSync(tmp, msg, "utf8");
  try {
    execFileSync("git", ["commit", "-F", tmp], { cwd: root, stdio: "inherit" });
  } finally {
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  }

  console.log("Done. Single commit on top of base with the first commit's message.");

  execFileSync("git", ["push", "--force-with-lease", "--no-verify"], { cwd: root, stdio: "inherit" });
}

main();
