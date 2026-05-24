/**
 * Деплой на Timeweb/VPS: vite build → rsync/scp dist → (опц.) обновление audio-proxy.
 *
 * Настройка: скопируй .env.deploy.example → .env.deploy
 * Запуск:   npm run deploy
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.deploy");

function loadDeployEnv() {
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function hasCmd(name) {
  const r = spawnSync(
    process.platform === "win32" ? "where" : "which",
    [name],
    { stdio: "ignore", shell: process.platform === "win32" },
  );
  return r.status === 0;
}

function run(label, cmd, args, opts = {}) {
  console.error(`\n→ ${label}`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    shell: process.platform === "win32",
    ...opts,
  });
  if (r.status !== 0) {
    console.error(`\n✗ ${label} (exit ${r.status ?? 1})`);
    process.exit(r.status ?? 1);
  }
}

function ssh(host, remoteCmd) {
  run(`ssh ${host}`, "ssh", [host, remoteCmd]);
}

const cfg = loadDeployEnv();
const host = cfg.DEPLOY_HOST?.trim();
const webRoot = (cfg.DEPLOY_WEB_ROOT || "/var/www/gayduk").replace(/\/$/, "");
const proxyDir = cfg.DEPLOY_PROXY_DIR?.trim();
const proxyService = cfg.DEPLOY_PROXY_SERVICE?.trim();
const oembedDir = (cfg.DEPLOY_OEMBED_DIR || "/opt/gayduk-oembed").trim();
const oembedService = (cfg.DEPLOY_OEMBED_SERVICE || "gayduk-oembed").trim();
const preferRsync = cfg.DEPLOY_RSYNC !== "0";
const args = new Set(process.argv.slice(2));
const skipBuild = args.has("--skip-build");
const webOnly = args.has("--web-only");
const proxyOnly = args.has("--proxy-only");

if (!host) {
  console.error(
    "Нужен .env.deploy с DEPLOY_HOST=user@your-server (см. .env.deploy.example)",
  );
  process.exit(1);
}

if (!skipBuild && !proxyOnly) {
  run("npm run build", "npm", ["run", "build"]);
}

if (!proxyOnly) {
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    console.error("Нет dist/index.html — сначала npm run build");
    process.exit(1);
  }

  ssh(host, `mkdir -p ${webRoot}`);

  const useRsync = preferRsync && hasCmd("rsync");
  if (useRsync) {
    const remote = `${host}:${webRoot}/`;
    run("rsync dist", "rsync", [
      "-avz",
      "--delete",
      "--exclude",
      ".gitkeep",
      `${dist}/`,
      remote,
    ]);
  } else {
    if (!hasCmd("scp")) {
      console.error("Нет scp в PATH. Установи OpenSSH Client или используй rsync.");
      process.exit(1);
    }
    run("scp dist", "scp", ["-r", `${dist}/.`, `${host}:${webRoot}/`]);
  }
}

if (!webOnly && proxyDir) {
  const staging = "~/deploy-staging/audio-proxy-server.mjs";
  ssh(host, "mkdir -p ~/deploy-staging");
  run("scp audio-proxy", "scp", [
    join(root, "audio-proxy-server.mjs"),
    `${host}:${staging}`,
  ]);
  ssh(
    host,
    `sudo install -m 644 -o root -g root ${staging} ${proxyDir}/audio-proxy-server.mjs`,
  );
  if (proxyService) {
    ssh(host, `sudo systemctl restart ${proxyService}`);
  }
}

if (!webOnly) {
  const stagingDir = "~/deploy-staging/oembed";
  ssh(host, `mkdir -p ${stagingDir}/scripts`);
  run("scp oembed-server", "scp", [
    join(root, "oembed-server.mjs"),
    `${host}:${stagingDir}/oembed-server.mjs`,
  ]);
  run("scp oembed-core", "scp", [
    join(root, "scripts/oembed-core.mjs"),
    `${host}:${stagingDir}/scripts/oembed-core.mjs`,
  ]);
  ssh(
    host,
    `sudo mkdir -p ${oembedDir}/scripts && sudo install -m 644 -o root -g root ${stagingDir}/oembed-server.mjs ${oembedDir}/oembed-server.mjs && sudo install -m 644 -o root -g root ${stagingDir}/scripts/oembed-core.mjs ${oembedDir}/scripts/oembed-core.mjs`,
  );
  ssh(
    host,
    `systemctl is-active --quiet ${oembedService} 2>/dev/null && sudo systemctl restart ${oembedService} || true`,
  );
}

console.error("\n✓ deploy ok");
