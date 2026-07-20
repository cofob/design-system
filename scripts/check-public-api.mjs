import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const repositoryRoot = process.cwd();
const manifestPath = "apps/showroom/src/data/public-api.json";
const componentManifestPath = "apps/showroom/src/data/components.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const componentManifest = JSON.parse(await readFile(componentManifestPath, "utf8"));
const componentNames = new Set(
  componentManifest.flatMap((group) => group.components.map((component) => component.name)),
);

const packageSources = {
  "@cofob/design-system-assets": {
    ".": "packages/design-system-assets/src/index.ts",
  },
  "@cofob/design-system-asciinema-player": {
    ".": "packages/design-system-asciinema-player/src/index.ts",
    "./react": "packages/design-system-asciinema-player/src/react/index.tsx",
    "./svelte": "packages/design-system-asciinema-player/src/svelte/index.ts",
  },
  "@cofob/design-system-css": {
    ".": "packages/design-system-css/src/index.ts",
    "./types": "packages/design-system-css/src/types.ts",
  },
  "@cofob/design-system-react": {
    ".": "packages/design-system-react/src/index.ts",
    "./static": "packages/design-system-react/src/static.tsx",
    "./client": "packages/design-system-react/src/client.tsx",
    "./types": "packages/design-system-react/src/types.ts",
  },
  "@cofob/design-system-svelte": {
    ".": "packages/design-system-svelte/src/lib/index.ts",
  },
  "@cofob/design-system-stickers": {
    ".": "packages/design-system-stickers/src/index.ts",
    "./react": "packages/design-system-stickers/src/react/index.tsx",
    "./svelte": "packages/design-system-stickers/src/svelte/index.ts",
  },
};

const dataEntrypoints = {
  "@cofob/design-system-stickers": new Set([
    "./react/*",
    "./svelte/*",
    "./stickers/*",
    "./manifests/*",
    "./catalogs/*",
    "./assets/*",
  ]),
};

function hasExportModifier(node) {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function resolveRelativeModule(sourcePath, specifier) {
  if (!specifier.startsWith(".")) return null;
  const absoluteBase = path.resolve(repositoryRoot, path.dirname(sourcePath), specifier);
  const withoutJavaScriptExtension = absoluteBase.replace(/\.js$/, "");
  return [
    absoluteBase,
    `${withoutJavaScriptExtension}.ts`,
    `${withoutJavaScriptExtension}.tsx`,
    path.join(withoutJavaScriptExtension, "index.ts"),
    path.join(withoutJavaScriptExtension, "index.tsx"),
  ].map((candidate) => path.relative(repositoryRoot, candidate));
}

const exportCache = new Map();

async function collectExports(sourcePath) {
  if (exportCache.has(sourcePath)) return exportCache.get(sourcePath);

  const result = new Set();
  exportCache.set(sourcePath, result);
  const sourceText = await readFile(path.resolve(repositoryRoot, sourcePath), "utf8");
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    sourcePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) result.add(element.name.text);
        continue;
      }

      if (
        !statement.exportClause &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const candidates = resolveRelativeModule(sourcePath, statement.moduleSpecifier.text);
        if (!candidates) continue;
        let resolved = null;
        for (const candidate of candidates) {
          try {
            await readFile(path.resolve(repositoryRoot, candidate), "utf8");
            resolved = candidate;
            break;
          } catch {
            // Try the next TypeScript-compatible module candidate.
          }
        }
        if (resolved) {
          const nested = await collectExports(resolved);
          for (const name of nested) result.add(name);
        }
      }
      continue;
    }

    if (!hasExportModifier(statement)) continue;
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      if (statement.name) result.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) result.add(declaration.name.text);
      }
    }
  }

  return result;
}

function formatNames(names) {
  return [...names].sort((left, right) => left.localeCompare(right)).join(", ");
}

const manifestPackages = new Map(manifest.packages.map((packageEntry) => [packageEntry.name, packageEntry]));

for (const [packageName, entrypointSources] of Object.entries(packageSources)) {
  const packageEntry = manifestPackages.get(packageName);
  if (!packageEntry) throw new Error(`${packageName} is missing from ${manifestPath}`);

  const packageDirectory = entrypointSources["."].split("/src/")[0];
  const packageJson = JSON.parse(await readFile(`${packageDirectory}/package.json`, "utf8"));
  const ignoredEntrypoints = dataEntrypoints[packageName] ?? new Set();
  const publishedEntrypoints = new Set(
    Object.keys(packageJson.exports).filter(
      (specifier) => specifier !== "./package.json" && !ignoredEntrypoints.has(specifier),
    ),
  );
  const documentedEntrypoints = new Set(packageEntry.entrypoints.map((entrypoint) => entrypoint.specifier));
  const missingEntrypoints = publishedEntrypoints.difference(documentedEntrypoints);
  const extraEntrypoints = documentedEntrypoints.difference(publishedEntrypoints);
  if (missingEntrypoints.size || extraEntrypoints.size) {
    throw new Error(
      `${packageName} entrypoint documentation differs from package.json` +
        `\nMissing: ${formatNames(missingEntrypoints) || "none"}` +
        `\nExtra: ${formatNames(extraEntrypoints) || "none"}`,
    );
  }

  const documentedItems = packageEntry.groups.flatMap((group) => group.items);
  const documentedNames = documentedItems.map((item) => item.name);
  const duplicate = documentedNames.find((name, index) => documentedNames.indexOf(name) !== index);
  if (duplicate) throw new Error(`${packageName} documents ${duplicate} more than once`);

  for (const item of documentedItems) {
    if (!item.summary || !item.signature || !item.entrypoints?.length) {
      throw new Error(`${packageName} documentation for ${item.name} is incomplete`);
    }
    for (const entrypoint of item.entrypoints) {
      const sourcePath = entrypointSources[entrypoint];
      if (!sourcePath)
        throw new Error(`${item.name} references unknown entrypoint ${packageName}${entrypoint}`);
      const exports = await collectExports(sourcePath);
      if (!exports.has(item.name)) {
        throw new Error(
          `${item.name} is documented from ${packageName}${entrypoint}, but is not exported there`,
        );
      }
    }
  }

  const rootExports = await collectExports(entrypointSources["."]);
  const adapterComponents = packageName === "@cofob/design-system-css" ? new Set() : componentNames;
  const expectedDocumentation = rootExports.difference(adapterComponents);
  const documentedExports = new Set(documentedNames);
  const missingExports = expectedDocumentation.difference(documentedExports);
  const extraExports = documentedExports.difference(expectedDocumentation);
  if (missingExports.size || extraExports.size) {
    throw new Error(
      `${packageName} public API documentation is out of sync` +
        `\nMissing: ${formatNames(missingExports) || "none"}` +
        `\nExtra: ${formatNames(extraExports) || "none"}`,
    );
  }
}

const unknownPackages = manifest.packages.filter((packageEntry) => !packageSources[packageEntry.name]);
if (unknownPackages.length) {
  throw new Error(
    `Unknown public API package entries: ${unknownPackages.map((entry) => entry.name).join(", ")}`,
  );
}

console.log("All published entrypoints and non-component exports are documented in the public API manifest.");
