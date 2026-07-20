import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const packageRequirements = {
  "@cofob/design-system-assets": {
    files: [
      "LICENSE",
      "README.md",
      "dist/index.js",
      "dist/index.d.ts",
      "dist/cli.js",
      "dist/cli.d.ts",
      "dist/types.js",
      "dist/types.d.ts",
    ],
    patterns: [
      { description: "compiled JavaScript", test: (file) => /^dist\/.+\.js$/.test(file) },
      { description: "TypeScript declarations", test: (file) => /^dist\/.+\.d\.ts$/.test(file) },
    ],
  },
  "@cofob/design-system-stickers": {
    files: [
      "LICENSE",
      "README.md",
      "THIRD_PARTY_NOTICES.md",
      "dist/index.js",
      "dist/index.d.ts",
      "dist/react/index.js",
      "dist/react/index.d.ts",
      "dist/svelte/index.js",
      "dist/svelte/index.d.ts",
      "dist/cli.js",
    ],
    patterns: [
      { description: "optimized WebP sticker assets", test: (file) => /^dist\/assets\/.+\.webp$/.test(file) },
      { description: "optimized WebM sticker assets", test: (file) => /^dist\/assets\/.+\.webm$/.test(file) },
      {
        description: "per-pack sticker catalogs",
        test: (file) => /^dist\/generated\/catalogs\/.+\.json$/.test(file),
      },
      {
        description: "per-sticker manifests",
        test: (file) => /^dist\/generated\/manifests\/.+\.json$/.test(file),
      },
      {
        description: "per-sticker metadata exports",
        test: (file) => /^dist\/generated\/stickers\/.+\.js$/.test(file),
      },
      { description: "generated React exports", test: (file) => file === "dist/react/index.js" },
      {
        description: "generated Svelte components",
        test: (file) => /^dist\/svelte\/generated\/.+\.svelte$/.test(file),
      },
    ],
  },
  "@cofob/design-system-css": {
    files: [
      "LICENSE",
      "LICENSES/OFL-1.1.txt",
      "dist/index.css",
      "dist/tokens.css",
      "dist/fonts.css",
      "dist/base.css",
      "dist/components.css",
      "dist/postcss.css",
      "dist/index.js",
      "dist/index.d.ts",
      "dist/fonts/Manrope.woff2",
    ],
  },
  "@cofob/design-system-react": {
    files: [
      "LICENSE",
      "dist/index.js",
      "dist/index.d.ts",
      "dist/static.js",
      "dist/static.d.ts",
      "dist/client.js",
      "dist/client.d.ts",
      "dist/types.js",
      "dist/types.d.ts",
    ],
    patterns: [
      { description: "compiled JavaScript", test: (file) => /^dist\/.+\.js$/.test(file) },
      { description: "TypeScript declarations", test: (file) => /^dist\/.+\.d\.ts$/.test(file) },
    ],
  },
  "@cofob/design-system-svelte": {
    files: ["LICENSE", "dist/index.js", "dist/index.d.ts", "dist/types.js", "dist/types.d.ts"],
    patterns: [
      { description: "compiled JavaScript", test: (file) => /^dist\/.+\.js$/.test(file) },
      { description: "TypeScript declarations", test: (file) => /^dist\/.+\.d\.ts$/.test(file) },
      {
        description: "packaged Svelte components",
        test: (file) => /^dist\/components\/.+\.svelte$/.test(file),
      },
      {
        description: "Svelte component declarations",
        test: (file) => /^dist\/components\/.+\.svelte\.d\.ts$/.test(file),
      },
    ],
  },
};

const packageDirectories = [
  "design-system-assets",
  "design-system-stickers",
  "design-system-css",
  "design-system-react",
  "design-system-svelte",
];

function parsePackResult(stdout, packageName) {
  const jsonStart = stdout.lastIndexOf("\n[");
  const json = (jsonStart >= 0 ? stdout.slice(jsonStart + 1) : stdout).trim();
  try {
    const [pack] = JSON.parse(json);
    if (!pack?.files) throw new Error("npm did not return a package file list");
    return pack;
  } catch (error) {
    throw new Error(`${packageName}: could not parse npm pack --json output: ${error.message}`, {
      cause: error,
    });
  }
}

function collectExportTargets(value, targets = []) {
  if (typeof value === "string") {
    if (value.startsWith("./") && value !== "./package.json" && !value.includes("*"))
      targets.push(value.slice(2));
    return targets;
  }
  if (!value || typeof value !== "object") return targets;
  for (const child of Object.values(value)) collectExportTargets(child, targets);
  return targets;
}

function assertPackageContents(manifest, pack) {
  const requirements = packageRequirements[manifest.name];
  if (!requirements) throw new Error(`${manifest.name}: package-specific archive requirements are undefined`);

  const packedFiles = new Map(pack.files.map((file) => [file.path, file]));
  const exportedFiles = collectExportTargets(manifest.exports);
  const requiredFiles = [...new Set([...requirements.files, ...exportedFiles])];
  const errors = [];

  for (const file of requiredFiles) {
    const packed = packedFiles.get(file);
    if (!packed) errors.push(`missing required file: ${file}`);
    else if (packed.size <= 0) errors.push(`required file is empty: ${file}`);
  }

  for (const pattern of requirements.patterns ?? []) {
    if (![...packedFiles.keys()].some(pattern.test)) errors.push(`missing ${pattern.description} in dist`);
  }

  const font = packedFiles.get("dist/fonts/Manrope.woff2");
  if (font && font.size < 1_000) errors.push("dist/fonts/Manrope.woff2 is unexpectedly small");

  if (errors.length > 0) {
    throw new Error(`${manifest.name} archive failed acceptance checks:\n- ${errors.join("\n- ")}`);
  }
}

for (const directory of packageDirectories) {
  const cwd = new URL(`../packages/${directory}/`, import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("package.json", cwd), "utf8"));
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd,
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "cofob-design-system-npm-cache"),
    },
  });
  if (result.status !== 0) {
    console.error(`${manifest.name}: npm pack --dry-run failed\n${result.stderr || result.stdout}`);
    process.exit(result.status ?? 1);
  }

  // Lifecycle scripts such as `svelte-package` can write progress messages to
  // stdout before npm emits its JSON result. Parse the final JSON document.
  const pack = parsePackResult(result.stdout, manifest.name);
  assertPackageContents(manifest, pack);
  console.log(`${manifest.name}: ${pack.entryCount} files, ${pack.size} bytes packed — archive accepted`);
}
