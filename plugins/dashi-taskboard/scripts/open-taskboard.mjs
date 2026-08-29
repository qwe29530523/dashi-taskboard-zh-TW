#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = realpathSync(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(path.dirname(scriptPath), "..");
const launchPort = process.env.CODEX_TASKBOARD_CDP_PORT || "9231";
const preferredHost = process.env.CODEX_TASKBOARD_HOST || "127.0.0.1";
const repositoryUrl = "https://github.com/qwe29530523/dashi-taskboard-zh-TW.git";
const managedRoot = path.join(os.homedir(), ".cache", "dashi-taskboard-zh-tw", "repo");

function packageLooksLikeTaskboard(root) {
  try {
    const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    return packageJson.name === "codex-taskboard"
      && existsSync(path.join(root, "scripts", "codex-injector.mjs"))
      && existsSync(path.join(root, "server", "index.mjs"));
  } catch {
    return false;
  }
}

function findTaskboardRoot() {
  const candidates = [];
  if (process.env.DASHI_TASKBOARD_ROOT) candidates.push(path.resolve(process.env.DASHI_TASKBOARD_ROOT));
  candidates.push(...runningTaskboardRoots());

  let current = pluginRoot;
  for (let index = 0; index < 8; index += 1) {
    candidates.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  candidates.push(managedRoot);

  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (packageLooksLikeTaskboard(candidate)) return candidate;
  }

  return cloneManagedTaskboardRoot();
}

function runningTaskboardRoots() {
  const result = spawnSync("/bin/ps", ["-ww", "-axo", "command="], {
    encoding: "utf8",
  });
  if (result.status !== 0) return [];

  const roots = [];
  const patterns = [
    /(^|\s)(\/[^\s]*?)\/scripts\/codex-injector\.mjs(?=\s|$)/g,
    /(^|\s)(\/[^\s]*?)\/server\/index\.mjs(?=\s|$)/g,
  ];

  for (const line of result.stdout.split("\n")) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        roots.push(match[2]);
      }
    }
  }

  return roots;
}

function cloneManagedTaskboardRoot() {
  const parent = path.dirname(managedRoot);
  mkdirSync(parent, { recursive: true });
  if (existsSync(managedRoot)) {
    throw new Error(`Taskboard cache exists but is not a valid repository: ${managedRoot}`);
  }
  const git = commandExists("git");
  if (!git) {
    throw new Error("Could not find git to download qwe29530523/dashi-taskboard-zh-TW.");
  }
  const result = spawnSync(git, ["clone", "--depth", "1", repositoryUrl, managedRoot], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`git clone failed with exit code ${result.status ?? "unknown"}.`);
  }
  if (!packageLooksLikeTaskboard(managedRoot)) {
    throw new Error(`Downloaded repository is not a valid Dashi Taskboard checkout: ${managedRoot}`);
  }
  return managedRoot;
}

function commandExists(command) {
  const result = spawnSync("/usr/bin/env", ["sh", "-lc", `command -v ${command}`], {
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function npmPath() {
  const alongsideNode = path.join(path.dirname(process.execPath), "npm");
  const codexRuntimeNpm = path.join(
    os.homedir(),
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "node",
    "bin",
    "npm",
  );
  const codexAppNpm = "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/npm";
  if (existsSync(alongsideNode)) return alongsideNode;
  if (existsSync(codexRuntimeNpm)) return codexRuntimeNpm;
  if (existsSync(codexAppNpm)) return codexAppNpm;
  return commandExists("npm");
}

function runNpmCiIfNeeded(projectRoot, env) {
  if (existsSync(path.join(projectRoot, "node_modules"))) return;
  const npm = npmPath();
  if (!npm) {
    throw new Error("Dependencies are missing and npm could not be found.");
  }
  const result = spawnSync(npm, ["ci"], {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`npm ci failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function readRuntime(projectRoot) {
  try {
    const runtimePath = path.join(projectRoot, ".data", "launcher-runtime.json");
    return JSON.parse(readFileSync(runtimePath, "utf8"));
  } catch {
    return null;
  }
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function openExisting(runtime) {
  try {
    process.kill(runtime.pid, "SIGUSR2");
  } catch {}
  console.log(JSON.stringify({
    status: "opened",
    alreadyRunning: true,
    pid: runtime.pid,
    taskboardUrl: runtime.url,
  }, null, 2));
}

function startLauncher(projectRoot, env) {
  const dataDir = path.join(projectRoot, ".data");
  mkdirSync(dataDir, { recursive: true });
  const logPath = path.join(dataDir, "codex-taskboard-plugin.log");
  const log = openSync(logPath, "a");
  const child = spawn(process.execPath, [
    path.join(projectRoot, "scripts", "codex-injector.mjs"),
    "--launch",
    "--watch",
    "--open",
    "--port",
    launchPort,
  ], {
    cwd: projectRoot,
    detached: true,
    env,
    stdio: ["ignore", log, log],
  });
  child.unref();
  return { pid: child.pid, logPath };
}

function waitForRuntime(projectRoot, startedPid, logPath) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const runtime = readRuntime(projectRoot);
    if (runtime && pidAlive(runtime.pid)) {
      console.log(JSON.stringify({
        status: "started",
        launcherPid: runtime.pid,
        startedPid,
        taskboardUrl: runtime.url,
        logPath,
      }, null, 2));
      return;
    }
    sleep(250);
  }

  console.log(JSON.stringify({
    status: "starting",
    startedPid,
    message: "Dashi Taskboard launcher is still starting.",
    logPath,
  }, null, 2));
}

try {
  const projectRoot = findTaskboardRoot();
  const env = {
    ...process.env,
    CODEX_TASKBOARD_HOST: preferredHost,
    PATH: [
      path.dirname(process.execPath),
      path.join(projectRoot, "node_modules", ".bin"),
      process.env.PATH || "",
    ].join(path.delimiter),
  };

  runNpmCiIfNeeded(projectRoot, env);

  const runtime = readRuntime(projectRoot);
  if (runtime && pidAlive(runtime.pid)) {
    openExisting(runtime);
  } else {
    const started = startLauncher(projectRoot, env);
    waitForRuntime(projectRoot, started.pid, started.logPath);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
