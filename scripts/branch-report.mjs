#!/usr/bin/env node
/**
 * Report local and remote branches: counts, merged vs unmerged, and for each
 * local branch why it appears unmerged (squash-merged PR vs closed PR vs no PR).
 *
 * Usage: node scripts/branch-report.mjs
 *    or: npm run branch:report
 *
 * Requires: git, gh (GitHub CLI). Run from repo root.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, options = {}) {
  const opts = {
    encoding: "utf8",
    stdio: options.quiet ? "pipe" : "inherit",
    ...options,
  };
  return execSync(cmd, opts);
}

function runQuiet(cmd, options = {}) {
  try {
    return run(cmd, { quiet: true, ...options }).trim();
  } catch {
    return null;
  }
}

function repoRoot() {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function parseBranchLines(output) {
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => line.trim().replace(/^\*\s*/, ""))
    .filter(Boolean);
}

function getLocalBranches(cwd) {
  const out = runQuiet("git branch", { cwd });
  return parseBranchLines(out).filter((b) => b !== "main");
}

function getRemoteBranches(cwd) {
  const out = runQuiet("git branch -r", { cwd });
  if (!out) return [];
  return out
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      const match = trimmed.match(/^origin\/(.+?)(?:\s+->|$)/);
      return match ? match[1] : null;
    })
    .filter((b) => b && b !== "main" && b !== "HEAD");
}

function getMergedLocal(cwd) {
  const out = runQuiet("git branch --merged main", { cwd });
  return new Set(parseBranchLines(out).filter((b) => b !== "main"));
}

function getMergedRemote(cwd) {
  const out = runQuiet("git branch -r --merged main", { cwd });
  if (!out) return new Set();
  const names = out
    .split("\n")
    .map((line) => {
      const trimmed = line.trim().replace(/^origin\//, "").replace(/\s+->.*$/, "");
      return trimmed;
    })
    .filter((b) => b && b !== "main" && b !== "HEAD");
  return new Set(names);
}

function branchTipInMain(cwd, branch) {
  try {
    const mergeBase = runQuiet(`git merge-base main "${branch}"`, { cwd });
    const tip = runQuiet(`git rev-parse "${branch}"`, { cwd });
    return mergeBase === tip;
  } catch {
    return false;
  }
}

function getPrByBranch(cwd) {
  try {
    const json = runQuiet('gh pr list --state all --limit 500 --json headRefName,state,number,title', { cwd });
    if (!json) return new Map();
    const list = JSON.parse(json);
    const map = new Map();
    for (const pr of list) {
      map.set(pr.headRefName, { state: pr.state, number: pr.number, title: pr.title });
    }
    return map;
  } catch {
    return new Map();
  }
}

function main() {
  const root = repoRoot();
  const cwd = root;

  console.log("Fetching and pruning remote refs...\n");
  runQuiet("git fetch origin --prune", { cwd });

  const localBranches = getLocalBranches(cwd);
  const remoteBranches = getRemoteBranches(cwd);
  const mergedLocal = getMergedLocal(cwd);
  const mergedRemote = getMergedRemote(cwd);
  const prByBranch = getPrByBranch(cwd);

  // --- Summary counts ---
  console.log("=== Summary ===\n");
  console.log(`Local branches (excluding main):  ${localBranches.length}`);
  console.log(`Remote branches (excluding main): ${remoteBranches.length}`);
  console.log(`Local branches merged into main:  ${mergedLocal.size}`);
  console.log(`Remote branches merged into main: ${mergedRemote.size}`);
  console.log("");

  if (localBranches.length === 0 && remoteBranches.length === 0) {
    console.log("No non-main branches. Done.");
    return;
  }

  // --- Remote branches list ---
  if (remoteBranches.length > 0) {
    console.log("=== Remote branches ===\n");
    for (const b of remoteBranches.sort()) {
      const merged = mergedRemote.has(b) ? "merged" : "not merged";
      console.log(`  ${b} (${merged})`);
    }
    console.log("");
  }

  // --- Local branches with PR and "why unmerged" ---
  if (localBranches.length > 0) {
    console.log("=== Local branches ===\n");
    console.log("Branch | PR | PR state | Why unmerged locally");
    console.log("-------|----|----------|---------------------");

    for (const branch of localBranches.sort()) {
      const pr = prByBranch.get(branch);
      const prStr = pr ? `#${pr.number} ${pr.title.slice(0, 30)}${pr.title.length > 30 ? "…" : ""}` : "—";
      const prState = pr ? pr.state : "—";
      const mergedIntoMain = mergedLocal.has(branch);
      const tipInMain = branchTipInMain(cwd, branch);

      let reason;
      if (mergedIntoMain) {
        reason = "merged (branch tip in main)";
      } else if (pr) {
        if (pr.state === "MERGED") {
          reason = tipInMain
            ? "merged (branch tip in main)"
            : "squash-merged (changes in main; branch tip not in history)";
        } else if (pr.state === "CLOSED") {
          reason = "PR closed without merging";
        } else {
          reason = "PR open";
        }
      } else {
        reason = "no PR found";
      }

      console.log(`${branch} | ${prStr} | ${prState} | ${reason}`);
    }
    console.log("");
  }

  console.log("---");
  console.log("Delete merged local:  git branch --merged main (then branch -d each, excluding main).");
  console.log("Delete merged remote: git branch -r --merged main (then git push origin --delete <name> for each, excluding main).");
}

main();
