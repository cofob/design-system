import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { convertTgs } from "@cofob/design-system-assets";
import sharp from "sharp";
import { optimize } from "svgo";

const OUTPUT_SIZE = 192;
const VIDEO_SKELETON_SIZE = 128;
const CONCURRENCY = 3;
const root = fileURLToPath(new URL("../", import.meta.url));
const cacheRoot = path.join(root, ".cache", "telegram");
const stageRoot = path.join(root, ".cache", `stage-${process.pid}-${randomUUID()}`);

const packs = [
  { key: "animated_chris", slug: "animated-chris", componentPrefix: "AnimatedChris" },
  { key: "PhSilver", slug: "ph-silver", componentPrefix: "PhSilver" },
  { key: "nyyyyyyb_by_fStikBot", slug: "nyyyyyyb", componentPrefix: "Nyyyyyyb" },
  {
    key: "the_gates_of_orgrimmar",
    slug: "the-gates-of-orgrimmar",
    componentPrefix: "TheGatesOfOrgrimmar",
  },
  { key: "FlunkyAll_by_fStikBot", slug: "flunky-all", componentPrefix: "FlunkyAll" },
  { key: "Cutecatsmeme", slug: "cute-cats-meme", componentPrefix: "CuteCatsMeme" },
  { key: "ManedDerpAnimated", slug: "maned-derp-animated", componentPrefix: "ManedDerpAnimated" },
  { key: "vibe_flag", slug: "vibe-flag", componentPrefix: "VibeFlag" },
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeIdentifier(value) {
  if (!/^[A-Za-z_$][\w$]*$/u.test(value)) throw new Error(`Unsafe generated identifier: ${value}`);
  return value;
}

function assetIdentifier(componentName) {
  return safeIdentifier(`${componentName[0].toLowerCase()}${componentName.slice(1)}Sticker`);
}

async function exists(filename) {
  try {
    await stat(filename);
    return true;
  } catch {
    return false;
  }
}

async function telegramApi(token, method, parameters) {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description ?? response.statusText}`);
  }
  return data.result;
}

async function downloadSticker(token, sticker) {
  const file = await telegramApi(token, "getFile", { file_id: sticker.file_id });
  const extension = path.extname(file.file_path).toLowerCase();
  if (![".tgs", ".webm", ".webp"].includes(extension)) {
    throw new Error(`Unsupported Telegram sticker extension: ${extension || "(none)"}`);
  }
  const unique = sticker.file_unique_id.replace(/[^a-z0-9_-]/giu, "_");
  const cached = path.join(cacheRoot, `${unique}${extension}`);
  if (!(await exists(cached))) {
    const response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`);
    if (!response.ok) throw new Error(`Telegram file download failed with HTTP ${response.status}.`);
    await writeFile(cached, Buffer.from(await response.arrayBuffer()));
  }
  return { cached, extension };
}

function runFfmpeg(args, description) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], {
      shell: false,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-16_000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${description} failed with FFmpeg code ${code}: ${stderr.trim()}`));
    });
  });
}

async function normalizeVideo(input, output) {
  await runFfmpeg(
    [
      "-y",
      "-i",
      input,
      "-vf",
      `scale=${OUTPUT_SIZE}:${OUTPUT_SIZE}:force_original_aspect_ratio=decrease,pad=${OUTPUT_SIZE}:${OUTPUT_SIZE}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`,
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "28",
      "-pix_fmt",
      "yuva420p",
      "-auto-alt-ref",
      "0",
      "-row-mt",
      "1",
      "-metadata:s:v:0",
      "alpha_mode=1",
      output,
    ],
    "Video sticker normalization",
  );
}

function ratio(value) {
  const [numerator, denominator = "1"] = String(value).split("/");
  const result = Number(numerator) / Number(denominator);
  return Number.isFinite(result) ? result : 0;
}

function inspectVideo(filename) {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,avg_frame_rate,nb_frames:format=duration",
      "-of",
      "json",
      filename,
    ],
    { encoding: "utf8", maxBuffer: 1_000_000, shell: false },
  );
  if (result.status !== 0) throw new Error(`ffprobe failed: ${result.stderr.trim()}`);
  const data = JSON.parse(result.stdout);
  const stream = data.streams?.[0];
  const duration = Number(data.format?.duration ?? 0);
  const fps = ratio(stream?.avg_frame_rate);
  const reportedFrames = Number(stream?.nb_frames);
  return {
    width: Number(stream?.width),
    height: Number(stream?.height),
    fps,
    duration,
    frameCount:
      Number.isFinite(reportedFrames) && reportedFrames > 0 ? reportedFrames : Math.round(duration * fps),
  };
}

function firstVideoFrame(filename) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      filename,
      "-vf",
      `scale=${VIDEO_SKELETON_SIZE}:${VIDEO_SKELETON_SIZE}:force_original_aspect_ratio=decrease,pad=${VIDEO_SKELETON_SIZE}:${VIDEO_SKELETON_SIZE}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`,
      "-frames:v",
      "1",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgba",
      "pipe:1",
    ],
    { encoding: null, maxBuffer: 8_000_000, shell: false },
  );
  if (result.status !== 0)
    throw new Error(`Could not decode the first video frame: ${result.stderr.toString()}`);
  const expected = VIDEO_SKELETON_SIZE * VIDEO_SKELETON_SIZE * 4;
  if (result.stdout.byteLength !== expected) {
    throw new Error(`Decoded video frame has ${result.stdout.byteLength} bytes; expected ${expected}.`);
  }
  return result.stdout;
}

function channelRange(pixels, channel) {
  let minimum = 255;
  let maximum = 0;
  for (const pixel of pixels) {
    minimum = Math.min(minimum, pixel[channel]);
    maximum = Math.max(maximum, pixel[channel]);
  }
  return maximum - minimum;
}

function paletteFor(pixels, maximumColors = 32) {
  if (pixels.length === 0) return [];
  const buckets = [pixels];
  while (buckets.length < maximumColors) {
    let selectedIndex = -1;
    let selectedChannel = 0;
    let selectedScore = 0;
    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index];
      if (bucket.length < 2) continue;
      const ranges = [0, 1, 2, 3].map((channel) => channelRange(bucket, channel));
      const channel = ranges.indexOf(Math.max(...ranges));
      const score = ranges[channel] * bucket.length;
      if (score > selectedScore) {
        selectedIndex = index;
        selectedChannel = channel;
        selectedScore = score;
      }
    }
    if (selectedIndex < 0) break;
    const bucket = buckets[selectedIndex].toSorted(
      (left, right) => left[selectedChannel] - right[selectedChannel],
    );
    const midpoint = Math.floor(bucket.length / 2);
    buckets.splice(selectedIndex, 1, bucket.slice(0, midpoint), bucket.slice(midpoint));
  }
  return buckets.map((bucket) =>
    [0, 1, 2, 3].map((channel) =>
      Math.round(bucket.reduce((sum, pixel) => sum + pixel[channel], 0) / bucket.length),
    ),
  );
}

function nearestColor(pixel, palette) {
  let selected = 0;
  let selectedDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < palette.length; index += 1) {
    const color = palette[index];
    const distance =
      (pixel[0] - color[0]) ** 2 +
      (pixel[1] - color[1]) ** 2 +
      (pixel[2] - color[2]) ** 2 +
      (pixel[3] - color[3]) ** 2 * 0.5;
    if (distance < selectedDistance) {
      selected = index;
      selectedDistance = distance;
    }
  }
  return selected;
}

function vectorizeFrame(buffer) {
  const pixels = [];
  for (let offset = 0; offset < buffer.byteLength; offset += 4) {
    pixels.push([buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3]]);
  }
  const opaque = pixels.filter((pixel) => pixel[3] >= 8);
  const palette = paletteFor(opaque);
  const groups = new Map();
  for (let y = 0; y < VIDEO_SKELETON_SIZE; y += 1) {
    let x = 0;
    while (x < VIDEO_SKELETON_SIZE) {
      const pixel = pixels[y * VIDEO_SKELETON_SIZE + x];
      if (pixel[3] < 8 || palette.length === 0) {
        x += 1;
        continue;
      }
      const colorIndex = nearestColor(pixel, palette);
      let end = x + 1;
      while (end < VIDEO_SKELETON_SIZE) {
        const next = pixels[y * VIDEO_SKELETON_SIZE + end];
        if (next[3] < 8 || nearestColor(next, palette) !== colorIndex) break;
        end += 1;
      }
      const commands = groups.get(colorIndex) ?? [];
      commands.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      groups.set(colorIndex, commands);
      x = end;
    }
  }
  const paths = [...groups.entries()]
    .map(([index, commands]) => {
      const [red, green, blue, alpha] = palette[index];
      const opacity = alpha < 250 ? ` fill-opacity="${(alpha / 255).toFixed(3)}"` : "";
      return `<path fill="rgb(${red} ${green} ${blue})"${opacity} d="${commands.join("")}"/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIDEO_SKELETON_SIZE} ${VIDEO_SKELETON_SIZE}" width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${paths}</svg>`;
  return optimize(svg, { multipass: true }).data;
}

async function optimizeStatic(input) {
  return sharp(input, { animated: false })
    .rotate()
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
      fit: "contain",
      background: "#00000000",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

async function processSticker(token, pack, packMetadata, sticker, index, outputRoot) {
  const position = String(index + 1).padStart(3, "0");
  const componentName = safeIdentifier(`${pack.componentPrefix}${position}`);
  const identifier = assetIdentifier(componentName);
  const id = `${pack.slug}/${position}`;
  const sourceUrl = `https://t.me/addstickers/${pack.key}`;
  const { cached, extension } = await downloadSticker(token, sticker);
  const packOutput = path.join(outputRoot, "assets", pack.slug);
  await mkdir(packOutput, { recursive: true });

  const base = {
    id,
    index: index + 1,
    componentName,
    emoji: sticker.emoji || "",
    pack: pack.key,
    packTitle: packMetadata.title,
    sourceUrl,
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
  };

  if (extension === ".webp" && !sticker.is_animated && !sticker.is_video) {
    const optimized = await optimizeStatic(await readFile(cached));
    const hash = sha256(optimized);
    const filename = `${position}.${hash.slice(0, 12)}.webp`;
    await writeFile(path.join(packOutput, filename), optimized);
    return {
      identifier,
      asset: {
        ...base,
        kind: "static",
        mediaType: "image/webp",
        assetPath: `${pack.slug}/${filename}`,
        sha256: hash,
      },
    };
  }

  if (extension === ".tgs" && sticker.is_animated) {
    const conversionOutput = path.join(outputRoot, ".converted", pack.slug, position);
    const manifest = await convertTgs({
      input: cached,
      outputDir: conversionOutput,
      publicBase: `/stickers/${pack.slug}`,
      name: position,
      size: OUTPUT_SIZE,
      allowLegacyFps: true,
    });
    const filename = path.basename(manifest.sticker.src);
    await rename(path.join(conversionOutput, filename), path.join(packOutput, filename));
    return {
      identifier,
      asset: {
        ...base,
        kind: "animated",
        mediaType: "video/webm",
        sourceFormat: "tgs",
        assetPath: `${pack.slug}/${filename}`,
        src: `/stickers/${pack.slug}/${filename}`,
        skeletonSvg: manifest.sticker.skeletonSvg,
        fps: manifest.media.fps,
        frameCount: manifest.media.frameCount,
        duration: manifest.media.duration,
        sha256: manifest.hashes.webmSha256,
      },
    };
  }

  if (extension === ".webm" && sticker.is_video) {
    const temporary = path.join(outputRoot, ".converted", `${pack.slug}-${position}.webm`);
    await mkdir(path.dirname(temporary), { recursive: true });
    await normalizeVideo(cached, temporary);
    const optimized = await readFile(temporary);
    const hash = sha256(optimized);
    const filename = `${position}.${hash.slice(0, 12)}.webm`;
    const destination = path.join(packOutput, filename);
    await rename(temporary, destination);
    const media = inspectVideo(destination);
    if (media.width !== OUTPUT_SIZE || media.height !== OUTPUT_SIZE) {
      throw new Error(
        `${id} normalized to ${media.width}×${media.height}; expected ${OUTPUT_SIZE}×${OUTPUT_SIZE}.`,
      );
    }
    return {
      identifier,
      asset: {
        ...base,
        kind: "animated",
        mediaType: "video/webm",
        sourceFormat: "video",
        assetPath: `${pack.slug}/${filename}`,
        src: `/stickers/${pack.slug}/${filename}`,
        skeletonSvg: vectorizeFrame(firstVideoFrame(destination)),
        fps: media.fps,
        frameCount: media.frameCount,
        duration: media.duration,
        sha256: hash,
      },
    };
  }

  throw new Error(`${id} Telegram flags do not match downloaded ${extension}.`);
}

function metadataModule(entry) {
  const type = entry.asset.kind === "animated" ? "AnimatedStickerAsset" : "StaticStickerAsset";
  const [pack, position] = entry.asset.id.split("/");
  return `import manifest from "../manifests/${pack}/${position}.json" with { type: "json" };\nimport type { ${type} } from "../../types.js";\n\nexport const ${entry.identifier} = manifest as ${type};\n`;
}

function svelteWrapper(entry) {
  const runtime = entry.asset.kind === "animated" ? "AnimatedStickerAsset" : "StaticStickerAsset";
  return `<script lang="ts">\n  import type { ComponentProps } from "svelte";\n  import { ${entry.identifier} as asset } from "../../generated/stickers/${entry.asset.id.replace("/", "-")}.js";\n  import ${runtime} from "../${runtime}.svelte";\n\n  type Props = Omit<ComponentProps<typeof ${runtime}>, "asset">;\n  let props: Props = $props();\n</script>\n\n<${runtime} {...props} {asset} />\n`;
}

function rootIndex(packCatalog) {
  return `import type { StickerPack } from "./types.js";\n\nexport { DEFAULT_STICKER_ASSET_BASE, resolveAnimatedSticker, resolveStickerAsset } from "./shared.js";\nexport type { AnimatedStickerAsset, AnimatedStickerSourceFormat, StaticStickerAsset, StickerAsset, StickerAssetIndexEntry, StickerAssetKind, StickerPack } from "./types.js";\n\nexport const packs = ${JSON.stringify(packCatalog, undefined, 2)} as const satisfies readonly StickerPack[];\n`;
}

function indexEntry(entry) {
  const asset = { ...entry.asset };
  delete asset.skeletonSvg;
  delete asset.src;
  return { ...asset, manifestPath: `${entry.asset.id}.json` };
}

function reactWrapper(entry) {
  const factory =
    entry.asset.kind === "animated" ? "createAnimatedStickerComponent" : "createStaticStickerComponent";
  return `import { ${entry.identifier} } from "../../generated/stickers/${entry.asset.id.replace("/", "-")}.js";\nimport { ${factory} } from "../../react-runtime.js";\n\nexport const ${entry.asset.componentName} = ${factory}(${entry.identifier});\nexport default ${entry.asset.componentName};\n`;
}

function reactIndex(entries) {
  return `export type { AnimatedStickerComponentProps, GeneratedAnimatedStickerComponent, GeneratedStaticStickerComponent, StaticStickerComponentProps } from "../react-runtime.js";\n${entries.map((entry) => `export { default as ${entry.asset.componentName} } from "./generated/${entry.asset.componentName}.js";`).join("\n")}\n`;
}

function svelteIndex(entries) {
  return `${entries.map((entry) => `export { default as ${entry.asset.componentName} } from "./generated/${entry.asset.componentName}.svelte";`).join("\n")}\n`;
}

function thirdPartyNotices(packCatalog) {
  return `# Telegram sticker pack notices\n\nThe sticker images and animations in this package are third-party material and are not covered by the cofob.dev License. They remain owned by their respective authors. Preserve these canonical source links when using the assets.\n\n${packCatalog.map((pack) => `- [${pack.title}](${pack.sourceUrl}) — ${pack.stickerCount} stickers`).join("\n")}\n`;
}

async function replaceDirectory(staged, destination) {
  await rm(destination, { force: true, recursive: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await rename(staged, destination);
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token)
    throw new Error("TELEGRAM_BOT_TOKEN is required and is only read from the process environment.");
  const ffmpeg = spawnSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8", shell: false });
  if (ffmpeg.status !== 0 || !ffmpeg.stdout.includes("libvpx-vp9")) {
    throw new Error("FFmpeg with libvpx-vp9 is required.");
  }

  await mkdir(cacheRoot, { recursive: true });
  await mkdir(path.join(stageRoot, "assets"), { recursive: true });
  await mkdir(path.join(stageRoot, "generated", "stickers"), { recursive: true });
  await mkdir(path.join(stageRoot, "generated", "manifests"), { recursive: true });
  await mkdir(path.join(stageRoot, "generated", "catalogs"), { recursive: true });
  await mkdir(path.join(stageRoot, "react", "generated"), { recursive: true });
  await mkdir(path.join(stageRoot, "svelte", "generated"), { recursive: true });

  try {
    const packMetadata = [];
    const tasks = [];
    for (const pack of packs) {
      const metadata = await telegramApi(token, "getStickerSet", { name: pack.key });
      const catalog = {
        ...pack,
        title: metadata.title,
        sourceUrl: `https://t.me/addstickers/${pack.key}`,
        stickerCount: metadata.stickers.length,
        catalogPath: `${pack.slug}.json`,
      };
      packMetadata.push(catalog);
      metadata.stickers.forEach((sticker, index) => tasks.push({ pack, metadata, sticker, index }));
      process.stdout.write(`Fetched ${pack.key}: ${metadata.stickers.length} stickers\n`);
    }

    const entries = new Array(tasks.length);
    let cursor = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const taskIndex = cursor;
        cursor += 1;
        const task = tasks[taskIndex];
        if (!task) return;
        entries[taskIndex] = await processSticker(
          token,
          task.pack,
          task.metadata,
          task.sticker,
          task.index,
          stageRoot,
        );
        if ((taskIndex + 1) % 20 === 0 || taskIndex + 1 === tasks.length) {
          process.stdout.write(`Optimized ${taskIndex + 1}/${tasks.length}\n`);
        }
      }
    });
    await Promise.all(workers);

    for (const entry of entries) {
      const moduleName = `${entry.asset.id.replace("/", "-")}.ts`;
      const [pack, position] = entry.asset.id.split("/");
      await writeFile(path.join(stageRoot, "generated", "stickers", moduleName), metadataModule(entry));
      await mkdir(path.join(stageRoot, "generated", "manifests", pack), { recursive: true });
      await writeFile(
        path.join(stageRoot, "generated", "manifests", pack, `${position}.json`),
        `${JSON.stringify(entry.asset, undefined, 2)}\n`,
      );
      await writeFile(
        path.join(stageRoot, "react", "generated", `${entry.asset.componentName}.tsx`),
        reactWrapper(entry),
      );
      await writeFile(
        path.join(stageRoot, "svelte", "generated", `${entry.asset.componentName}.svelte`),
        svelteWrapper(entry),
      );
    }

    for (const pack of packMetadata) {
      const packEntries = entries.filter((entry) => entry.asset.pack === pack.key).map(indexEntry);
      await writeFile(
        path.join(stageRoot, "generated", "catalogs", pack.catalogPath),
        `${JSON.stringify({ version: 1, pack, stickers: packEntries }, undefined, 2)}\n`,
      );
    }
    await replaceDirectory(path.join(stageRoot, "assets"), path.join(root, "assets"));
    await replaceDirectory(path.join(stageRoot, "generated"), path.join(root, "src", "generated"));
    await replaceDirectory(
      path.join(stageRoot, "react", "generated"),
      path.join(root, "src", "react", "generated"),
    );
    await replaceDirectory(
      path.join(stageRoot, "svelte", "generated"),
      path.join(root, "src", "svelte", "generated"),
    );
    await writeFile(path.join(root, "src", "index.ts"), rootIndex(packMetadata));
    await writeFile(path.join(root, "src", "react", "index.tsx"), reactIndex(entries));
    await writeFile(path.join(root, "src", "svelte", "index.ts"), svelteIndex(entries));
    await writeFile(path.join(root, "THIRD_PARTY_NOTICES.md"), thirdPartyNotices(packMetadata));
    process.stdout.write(`Generated ${entries.length} sticker assets and framework components.\n`);
  } finally {
    await rm(stageRoot, { force: true, recursive: true });
  }
}

main().catch((error) => {
  process.stderr.write(`generate-stickers: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
