import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { isPublished, preparePackage, renamePackages } from "./publish-npm.mjs";

test("rename only the six public package names, including subpaths", () => {
  for (const name of ["assets", "css", "react", "svelte", "asciinema-player", "stickers"]) {
    assert.equal(renamePackages(`@cofob/design-system-${name}/types`), `@cofob2/design-system-${name}/types`);
  }
  const unrelated = "@cofob/design-system-showroom @cofob/design-system-css-extra @other/design-system-css";
  assert.equal(renamePackages(unrelated), unrelated);
});

test("skip published versions; fail on registry and authentication errors", () => {
  const manifest = { name: "@cofob2/design-system-css", version: "0.5.0" };
  const execute =
    (status, stdout, stderr = "") =>
    () => ({ status, stdout, stderr });
  assert.equal(isPublished(manifest, execute(0, '"0.5.0"')), true);
  assert.equal(isPublished(manifest, execute(1, '{"error":{"code":"E404"}}')), false);
  assert.throws(() => isPublished(manifest, execute(0, '"0.4.0"')), /unexpected version/);
  for (const code of ["E401", "E403", "E500", "ENOTFOUND"]) {
    assert.throws(
      () => isPublished(manifest, execute(1, JSON.stringify({ error: { code } }))),
      new RegExp(code),
    );
  }
  assert.throws(() => isPublished(manifest, execute(1, "", "Connection failed")), /Connection failed/);
  assert.throws(
    () => isPublished(manifest, () => ({ error: new Error("Cannot start npm") })),
    /Cannot start npm/,
  );
});

test("prepare a complete npm archive without changing source files or binary assets", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "cofob-npm-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = path.join(directory, "source");
  const destination = path.join(directory, "archives");
  const unpacked = path.join(directory, "unpacked");
  for (const folder of [path.join(source, "dist"), destination, unpacked])
    await mkdir(folder, { recursive: true });
  const manifest = {
    name: "@cofob/design-system-react",
    version: "0.5.0",
    type: "module",
    files: ["dist", "LICENSE"],
    exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
    dependencies: { "@cofob/design-system-css": "0.5.0" },
    peerDependencies: { "@cofob/design-system-svelte": ">=0.1.0 <1" },
    peerDependenciesMeta: { "@cofob/design-system-svelte": { optional: true } },
    publishConfig: { registry: "https://npm.pkg.github.com", access: "public" },
    scripts: { prepack: "exit 1" },
  };
  const files = {
    "package.json": JSON.stringify(manifest),
    "README.md": "Import @cofob/design-system-react and @cofob/design-system-css/index.css.",
    LICENSE: "License text stays unchanged.",
    "secret.txt": "Must not be included.",
    "dist/index.js": 'export { copyText } from "@cofob/design-system-css";',
    "dist/index.d.ts": 'export type { ThemePreference } from "@cofob/design-system-css";',
    "dist/Example.svelte": '<script>import "@cofob/design-system-css/index.css";</script>',
    "dist/index.js.map": '{"sourcesContent":["@cofob/design-system-css"]}',
    "dist/asset.webp": Buffer.from([0, 255, 128, 42]),
  };
  for (const [name, content] of Object.entries(files)) await writeFile(path.join(source, name), content);
  const prepared = await preparePackage(source, destination);
  assert.equal(prepared.manifest.name, "@cofob2/design-system-react");
  assert.equal(prepared.manifest.version, manifest.version);
  assert.deepEqual(prepared.manifest.exports, manifest.exports);
  assert.deepEqual(prepared.manifest.dependencies, { "@cofob2/design-system-css": "0.5.0" });
  assert.deepEqual(prepared.manifest.peerDependencies, { "@cofob2/design-system-svelte": ">=0.1.0 <1" });
  assert.deepEqual(prepared.manifest.peerDependenciesMeta, {
    "@cofob2/design-system-svelte": { optional: true },
  });
  assert.equal(prepared.manifest.publishConfig.registry, "https://registry.npmjs.org/");
  assert.equal(prepared.manifest.publishConfig.access, "public");
  const extracted = spawnSync("tar", ["-xzf", prepared.archive, "-C", unpacked]);
  assert.equal(extracted.status, 0, extracted.stderr?.toString());
  for (const [name, content] of Object.entries(files)) {
    assert.deepEqual(await readFile(path.join(source, name)), Buffer.from(content));
    const target = path.join(unpacked, "package", name);
    if (name === "secret.txt") {
      await assert.rejects(readFile(target), { code: "ENOENT" });
    } else if (name !== "package.json") {
      const expected = typeof content === "string" ? renamePackages(content) : content;
      assert.deepEqual(await readFile(target), Buffer.from(expected));
    }
  }
});
