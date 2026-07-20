import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { DotLottie } from "@lottiefiles/dotlottie-web";
import { createCanvas } from "@napi-rs/canvas";

import { renderFirstFrameSvg } from "./svg.js";
import { parseTgs, type ParsedTgs } from "./tgs.js";
import type { ConvertTgsOptions, TgsConversionManifest } from "./types.js";

export type { AnimatedStickerModel, ConvertTgsOptions, TgsConversionManifest } from "./types.js";

const DEFAULT_CRF = 28;
const require = createRequire(import.meta.url);
let wasmConfigured = false;

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function localPath(value: string | URL): string {
  if (value instanceof URL) {
    if (value.protocol !== "file:") throw new Error("Only local file URLs are supported.");
    return fileURLToPath(value);
  }
  return path.resolve(value);
}

function outputName(inputPath: string, requested?: string): string {
  const candidate = requested ?? path.basename(inputPath, path.extname(inputPath));
  if (!/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/iu.test(candidate)) {
    throw new Error("Output name must contain only letters, numbers, underscores, and hyphens.");
  }
  return candidate;
}

function publicUrl(base: string | undefined, filename: string): string {
  if (!base) return `./${filename}`;
  return `${base.replace(/\/+$/u, "")}/${filename}`;
}

function validateCrf(value: number | undefined): number {
  const crf = value ?? DEFAULT_CRF;
  if (!Number.isInteger(crf) || crf < 0 || crf > 63) throw new Error("CRF must be an integer from 0 to 63.");
  return crf;
}

function validateSize(value: number | undefined, sourceSize: number): number {
  const size = value ?? sourceSize;
  if (!Number.isInteger(size) || size < 2 || size > sourceSize || size % 2 !== 0) {
    throw new Error(`Output size must be an even integer from 2 to ${sourceSize}.`);
  }
  return size;
}

function verifyFfmpeg(ffmpegPath: string): void {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-encoders"], { encoding: "utf8", shell: false });
  if (result.error || result.status !== 0) {
    throw new Error(`Could not execute FFmpeg at ${ffmpegPath}. Install FFmpeg or pass --ffmpeg-path.`, {
      cause: result.error,
    });
  }
  if (!result.stdout.includes("libvpx-vp9")) {
    throw new Error("FFmpeg must include the libvpx-vp9 encoder.");
  }
}

async function configureWasm(): Promise<void> {
  if (wasmConfigured) return;
  const wasm = await readFile(require.resolve("@lottiefiles/dotlottie-web/dotlottie-player.wasm"));
  DotLottie.setWasmUrl(`data:application/wasm;base64,${wasm.toString("base64")}`);
  wasmConfigured = true;
}

async function waitForLoad(player: DotLottie): Promise<void> {
  if (player.isLoaded) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timed out while loading TGS animation data.")),
      10_000,
    );
    player.addEventListener("load", () => {
      clearTimeout(timeout);
      resolve();
    });
    player.addEventListener("loadError", (event) => {
      clearTimeout(timeout);
      reject(new Error(`Could not load TGS animation: ${event.error}`));
    });
  });
}

async function encodeWebm(
  parsed: ParsedTgs,
  outputPath: string,
  ffmpegPath: string,
  crf: number,
  size: number,
): Promise<void> {
  await configureWasm();
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const player = new DotLottie({
    autoplay: false,
    canvas: canvas as unknown as HTMLCanvasElement,
    data: JSON.stringify(parsed.animation),
    loop: false,
    renderConfig: { autoResize: false, devicePixelRatio: 1 },
    useFrameInterpolation: false,
  });

  const ffmpeg = spawn(
    ffmpegPath,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "rawvideo",
      "-pixel_format",
      "rgba",
      "-video_size",
      `${size}x${size}`,
      "-framerate",
      String(parsed.animation.fr),
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuva420p",
      "-auto-alt-ref",
      "0",
      "-metadata:s:v:0",
      "alpha_mode=1",
      outputPath,
    ],
    { shell: false, stdio: ["pipe", "ignore", "pipe"] },
  );
  let stderr = "";
  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (chunk: string) => {
    stderr = `${stderr}${chunk}`.slice(-16_000);
  });

  try {
    await waitForLoad(player);
    if (Math.round(player.totalFrames) !== parsed.frameCount) {
      throw new Error(`Lottie reported ${player.totalFrames} frames; expected ${parsed.frameCount}.`);
    }
    for (let frame = 0; frame < parsed.frameCount; frame += 1) {
      player.setFrame(frame);
      const pixels = context.getImageData(0, 0, size, size).data;
      const buffer = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
      if (!ffmpeg.stdin.write(buffer)) await once(ffmpeg.stdin, "drain");
    }
    ffmpeg.stdin.end();
    const [code] = (await once(ffmpeg, "close")) as [number | null];
    if (code !== 0) throw new Error(`FFmpeg exited with code ${code}: ${stderr.trim() || "unknown error"}`);
  } catch (error) {
    ffmpeg.stdin.destroy();
    ffmpeg.kill();
    throw error;
  } finally {
    player.destroy();
  }
}

async function writeAtomic(target: string, contents: string): Promise<void> {
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, contents);
  try {
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function convertTgs(options: ConvertTgsOptions): Promise<TgsConversionManifest> {
  const inputPath = localPath(options.input);
  if (path.extname(inputPath).toLowerCase() !== ".tgs")
    throw new Error("Input file must use the .tgs extension.");
  const outputDir = localPath(options.outputDir);
  const name = outputName(inputPath, options.name);
  const crf = validateCrf(options.crf);
  const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
  verifyFfmpeg(ffmpegPath);

  const source = await readFile(inputPath);
  const parsed = parseTgs(source, { allowLegacyFps: options.allowLegacyFps === true });
  const size = validateSize(options.size, parsed.animation.w);
  const sourceSha256 = sha256(source);
  const skeletonSvg = await renderFirstFrameSvg(parsed.animation, { width: size, height: size });
  const skeletonSvgSha256 = sha256(skeletonSvg);

  await mkdir(outputDir, { recursive: true });
  const temporaryWebm = path.join(outputDir, `.${name}.${process.pid}.${randomUUID()}.webm`);
  try {
    await encodeWebm(parsed, temporaryWebm, ffmpegPath, crf, size);
    const webm = await readFile(temporaryWebm);
    const webmSha256 = sha256(webm);
    const webmFilename = `${name}.${webmSha256.slice(0, 12)}.webm`;
    const webmPath = path.join(outputDir, webmFilename);
    try {
      await stat(webmPath);
      await rm(temporaryWebm, { force: true });
    } catch {
      await rename(temporaryWebm, webmPath);
    }

    const manifest: TgsConversionManifest = {
      version: 1,
      sticker: {
        src: publicUrl(options.publicBase, webmFilename),
        skeletonSvg,
        width: size,
        height: size,
      },
      media: {
        type: "video/webm",
        fps: parsed.animation.fr,
        frameCount: parsed.frameCount,
        duration: parsed.duration,
        webmBytes: webm.byteLength,
      },
      hashes: { sourceSha256, webmSha256, skeletonSvgSha256 },
    };
    await writeAtomic(
      path.join(outputDir, `${name}.manifest.json`),
      `${JSON.stringify(manifest, undefined, 2)}\n`,
    );
    return manifest;
  } finally {
    await rm(temporaryWebm, { force: true });
  }
}
