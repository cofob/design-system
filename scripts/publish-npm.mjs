import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const registry = "https://registry.npmjs.org/";
const packages = ["assets", "css", "react", "svelte", "asciinema-player", "stickers"];
const root = fileURLToPath(new URL("../", import.meta.url));

export function renamePackages(text) {
  return text.replace(
    /@cofob\/design-system-(assets|css|react|svelte|asciinema-player|stickers)(?![\w-])/g,
    "@cofob2/design-system-$1",
  );
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      NODE_AUTH_TOKEN: "",
      NPM_TOKEN: "",
      npm_config_registry: registry,
      npm_config_loglevel: "error",
    },
  });
}

function checked(command, args, cwd) {
  const result = run(command, args, cwd);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}

export function isPublished(manifest, execute = run, targetRegistry = registry) {
  const result = execute("npm", [
    "view",
    `${manifest.name}@${manifest.version}`,
    "version",
    "--json",
    "--prefer-online",
    "--registry",
    targetRegistry,
  ]);
  if (result.error) throw result.error;
  if (result.status === 0) {
    if (JSON.parse(result.stdout) === manifest.version) return true;
    throw new Error("npm returned an unexpected version");
  }
  let code;
  try {
    code = JSON.parse(result.stdout).error?.code;
  } catch {
    // Non-JSON registry errors must also stop publication.
  }
  if (code === "E404") return false;
  throw new Error(result.stderr || result.stdout || "npm version lookup failed");
}

export async function rewritePackage(directory, targetRegistry = registry) {
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(?:js|mjs|cjs|ts|svelte|css|json|md|map)$/.test(entry.name)) continue;
    const file = path.join(entry.parentPath, entry.name);
    const text = await readFile(file, "utf8");
    const renamed = renamePackages(text);
    if (renamed !== text) await writeFile(file, renamed);
  }
  const file = path.join(directory, "package.json");
  const manifest = JSON.parse(await readFile(file, "utf8"));
  manifest.publishConfig = { ...manifest.publishConfig, registry: targetRegistry, access: "public" };
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export async function preparePackage(source, destination, targetRegistry = registry) {
  const [original] = JSON.parse(
    checked("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", destination], source),
  );
  const archive = path.join(destination, original.filename);
  checked("tar", ["-xzf", archive, "-C", destination]);
  const directory = path.join(destination, "package");
  const manifest = await rewritePackage(directory, targetRegistry);
  const [prepared] = JSON.parse(
    checked("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", destination], directory),
  );
  await rm(archive);
  await rm(directory, { recursive: true });
  return { manifest, archive: path.join(destination, prepared.filename) };
}

async function main() {
  const { values } = parseArgs({
    options: { "dry-run": { type: "boolean" }, registry: { type: "string", default: registry } },
  });
  const dryRun = values["dry-run"];
  const targetRegistry = values.registry;
  const destination = await mkdtemp(path.join(tmpdir(), "cofob-npm-"));
  try {
    for (const name of packages) {
      const source = path.join(root, "packages", `design-system-${name}`);
      const manifest = JSON.parse(renamePackages(await readFile(path.join(source, "package.json"), "utf8")));
      if (!dryRun && isPublished(manifest, run, targetRegistry)) {
        console.log(`Skip ${manifest.name}@${manifest.version}: already published`);
        continue;
      }
      const prepared = await preparePackage(source, destination, targetRegistry);
      const args = [
        "publish",
        prepared.archive,
        "--ignore-scripts",
        "--access",
        "public",
        "--registry",
        targetRegistry,
      ];
      if (dryRun) args.push("--dry-run", "--force");
      console.log(checked("npm", args, destination));
      console.log(`${manifest.name}@${manifest.version}: ${prepared.archive}`);
    }
  } finally {
    if (!dryRun) await rm(destination, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  await main();
}
