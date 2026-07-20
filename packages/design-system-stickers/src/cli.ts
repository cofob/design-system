#!/usr/bin/env node

import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `Usage:
  cf-stickers copy --out-dir <public/stickers>

Copies the optimized sticker tree into a consumer's public directory. Generated
React and Svelte components use /stickers as their default assetBaseUrl.
`;

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value.`);
  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.length === 0) {
    process.stdout.write(HELP);
    return;
  }
  if (args[0] !== "copy") throw new Error(`Expected \`cf-stickers copy\`.\n\n${HELP}`);
  const output = valueAfter(args, "--out-dir");
  if (!output) throw new Error("--out-dir is required.");
  const source = fileURLToPath(new URL("./assets/", import.meta.url));
  const target = path.resolve(output);
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true, force: true });
  process.stdout.write(`Copied optimized stickers to ${target}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`cf-stickers: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
