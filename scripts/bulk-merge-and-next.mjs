#!/usr/bin/env node
/**
 * Merge a bulk-task PR, update main, then check out the next open PR's branch,
 * merge main into it, push, and print what to test.
 *
 * Usage: pnpm run bulk:next [PR_NUMBER]
 * With no argument: merge the PR for the current branch, then switch to the next open PR.
 * With PR_NUMBER: merge that PR, then switch to the next open PR.
 * Example: pnpm run bulk:next
 * Example: pnpm run bulk:next -- 58
 *
 * Requires: gh (GitHub CLI), git. Run from repo root.
 * On merge conflict after "merge main", the script exits; resolve and push manually.
 */

import { execSync } from "child_process";
import fs from "fs";
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
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function main() {
  const root = repoRoot();
  const execOpts = { cwd: root };

  let prNum = process.argv[2];
  if (!prNum || !/^\d+$/.test(prNum)) {
    try {
      prNum = runQuiet("gh pr view --json number -q .number", execOpts);
    } catch {
      console.error("No PR number given and current branch has no open PR. Usage: pnpm run bulk:next [PR_NUMBER]");
      process.exit(1);
    }
    if (!prNum || !/^\d+$/.test(prNum)) {
      console.error("No PR number given and current branch has no open PR. Usage: pnpm run bulk:next [PR_NUMBER]");
      process.exit(1);
    }
  }

  console.log(`Merging PR #${prNum}...`);
  try {
    run(`gh pr merge ${prNum} --merge`, execOpts);
  } catch {
    console.error("Failed to merge PR. Is it open and mergeable?");
    process.exit(1);
  }

  console.log("Updating main...");
  run("git checkout main", execOpts);
  run("git pull", execOpts);

  const listJson = runQuiet("gh pr list --state open --json number,title,headRefName", execOpts);
  const prs = JSON.parse(listJson);
  if (prs.length === 0) {
    console.log("No open PRs left. You're done with the bulk run.");
    return;
  }

  prs.sort((a, b) => a.number - b.number);
  const next = prs[0];
  const branch = next.headRefName;

  console.log(`Checking out next PR branch: ${branch} (#${next.number})...`);
  try {
    run(`git checkout ${branch}`, execOpts);
  } catch {
    console.error(`Failed to checkout ${branch}. Run 'git fetch origin' and try again.`);
    process.exit(1);
  }

  console.log("Merging main into branch...");
  try {
    run("git merge main", execOpts);
  } catch {
    console.error("Merge conflict. Resolve conflicts, then run: git add . ; git commit --no-edit ; git push");
    process.exit(1);
  }

  const useNoVerify = process.env.BULK_NO_VERIFY === "1";
  console.log(useNoVerify ? "Pushing (--no-verify)..." : "Pushing...");
  try {
    run(`git push${useNoVerify ? " --no-verify" : ""}`, execOpts);
  } catch {
    console.error("Push failed. Fix and push manually.");
    process.exit(1);
  }

  console.log("");
  console.log("---");
  console.log(`Test: ${next.title}`);
  console.log("---");
}

main();
