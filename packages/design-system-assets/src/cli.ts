#!/usr/bin/env node

import { convertTgs, type ConvertTgsOptions } from "./index.js";

const HELP = `Usage:
  cf-tgs convert <input.tgs> --out-dir <directory> [options]

Options:
  --public-base <url>   Public URL prefix stored in the manifest
  --name <name>         Output basename (defaults to the input basename)
  --ffmpeg-path <path>  FFmpeg executable (defaults to ffmpeg on PATH)
  --crf <0-63>          VP9 quality value (defaults to 28)
  --size <pixels>        Even square output size (defaults to 512)
  --help                Show this help
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
  if (args[0] !== "convert" || !args[1] || args[1].startsWith("--")) {
    throw new Error(`Expected \`cf-tgs convert <input.tgs>\`.\n\n${HELP}`);
  }
  const outputDir = valueAfter(args, "--out-dir");
  if (!outputDir) throw new Error("--out-dir is required.");
  const crfValue = valueAfter(args, "--crf");
  const sizeValue = valueAfter(args, "--size");
  const options: ConvertTgsOptions = { input: args[1], outputDir };
  const publicBase = valueAfter(args, "--public-base");
  const name = valueAfter(args, "--name");
  const ffmpegPath = valueAfter(args, "--ffmpeg-path");
  if (publicBase !== undefined) options.publicBase = publicBase;
  if (name !== undefined) options.name = name;
  if (ffmpegPath !== undefined) options.ffmpegPath = ffmpegPath;
  if (crfValue !== undefined) options.crf = Number(crfValue);
  if (sizeValue !== undefined) options.size = Number(sizeValue);

  const manifest = await convertTgs(options);
  process.stdout.write(`${JSON.stringify(manifest, undefined, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`cf-tgs: ${message}\n`);
  process.exitCode = 1;
});
