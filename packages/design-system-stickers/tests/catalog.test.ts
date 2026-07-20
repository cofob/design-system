import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import { animatedChris001Sticker } from "../src/generated/stickers/animated-chris-001.js";
import { phSilver001Sticker } from "../src/generated/stickers/ph-silver-001.js";
import { createAnimatedStickerComponent, createStaticStickerComponent } from "../src/react-runtime.js";
import AnimatedChris001 from "../src/svelte/generated/AnimatedChris001.svelte";
import PhSilver001 from "../src/svelte/generated/PhSilver001.svelte";
import type { AnimatedStickerAsset, StickerAssetIndexEntry, StickerPack } from "../src/types.js";

const packageRoot = path.resolve(import.meta.dirname, "..");

interface PackCatalog {
  version: 1;
  pack: StickerPack;
  stickers: StickerAssetIndexEntry[];
}

async function catalogs(): Promise<PackCatalog[]> {
  const packs = [
    "animated-chris",
    "ph-silver",
    "nyyyyyyb",
    "the-gates-of-orgrimmar",
    "flunky-all",
    "cute-cats-meme",
    "maned-derp-animated",
    "vibe-flag",
  ];
  return Promise.all(
    packs.map(
      async (pack) =>
        JSON.parse(
          await readFile(path.join(packageRoot, "src/generated/catalogs", `${pack}.json`), "utf8"),
        ) as PackCatalog,
    ),
  );
}

async function stickers(): Promise<StickerAssetIndexEntry[]> {
  return (await catalogs()).flatMap((catalog) => catalog.stickers);
}

function inspectWebm(filename: string): {
  streams: Array<{
    codec_name?: string;
    codec_type?: string;
    width?: number;
    height?: number;
    tags?: { ALPHA_MODE?: string };
  }>;
} {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_name,codec_type,width,height:stream_tags=alpha_mode",
      "-of",
      "json",
      filename,
    ],
    { encoding: "utf8", shell: false },
  );
  if (result.status !== 0) throw new Error(result.stderr);
  return JSON.parse(result.stdout) as ReturnType<typeof inspectWebm>;
}

describe("published sticker catalog", () => {
  it("contains every sticker from the eight attributed packs", async () => {
    const value = await catalogs();
    expect(value.every((catalog) => catalog.version === 1)).toBe(true);
    expect(value.map(({ pack }) => [pack.key, pack.stickerCount])).toEqual([
      ["animated_chris", 37],
      ["PhSilver", 117],
      ["nyyyyyyb_by_fStikBot", 34],
      ["the_gates_of_orgrimmar", 120],
      ["FlunkyAll_by_fStikBot", 50],
      ["Cutecatsmeme", 120],
      ["ManedDerpAnimated", 50],
      ["vibe_flag", 48],
    ]);
    const entries = value.flatMap((catalog) => catalog.stickers);
    expect(entries).toHaveLength(576);
    expect(entries.filter((sticker) => sticker.kind === "static")).toHaveLength(408);
    expect(
      entries.filter((sticker) => sticker.kind === "animated" && sticker.sourceFormat === "tgs"),
    ).toHaveLength(85);
    expect(
      entries.filter((sticker) => sticker.kind === "animated" && sticker.sourceFormat === "video"),
    ).toHaveLength(83);
    expect(new Set(entries.map((sticker) => sticker.id)).size).toBe(576);
    expect(new Set(entries.map((sticker) => sticker.componentName)).size).toBe(576);
    for (const sticker of entries) {
      expect(sticker.sourceUrl).toBe(`https://t.me/addstickers/${sticker.pack}`);
      await expect(readFile(path.join(packageRoot, "assets", sticker.assetPath))).resolves.not.toHaveLength(
        0,
      );
    }
  });

  it("publishes normalized WebP and transparent VP9 media", async () => {
    const entries = await stickers();
    const staticSticker = entries.find((sticker) => sticker.kind === "static");
    const tgsSticker = entries.find(
      (sticker) => sticker.kind === "animated" && sticker.sourceFormat === "tgs",
    );
    const videoSticker = entries.find(
      (sticker) => sticker.kind === "animated" && sticker.sourceFormat === "video",
    );
    if (!staticSticker || !tgsSticker || !videoSticker) throw new Error("Catalog samples are missing.");

    const staticMetadata = await sharp(path.join(packageRoot, "assets", staticSticker.assetPath)).metadata();
    expect(staticMetadata).toMatchObject({ format: "webp", width: 192, height: 192, hasAlpha: true });

    for (const sticker of [tgsSticker, videoSticker]) {
      const media = inspectWebm(path.join(packageRoot, "assets", sticker.assetPath));
      const video = media.streams.find((stream) => stream.codec_type === "video");
      expect(video).toMatchObject({ codec_name: "vp9", width: 192, height: 192 });
      expect(video?.tags?.ALPHA_MODE).toBe("1");
      expect(media.streams.some((stream) => stream.codec_type === "audio")).toBe(false);
    }
  });

  it("keeps every colored first-frame SVG inline and free of external content", async () => {
    const animated = (await stickers()).filter((sticker) => sticker.kind === "animated");
    expect(animated).toHaveLength(168);
    for (const entry of animated) {
      const sticker = JSON.parse(
        await readFile(path.join(packageRoot, "src/generated/manifests", entry.manifestPath), "utf8"),
      ) as AnimatedStickerAsset;
      expect(sticker.skeletonSvg).toMatch(/^<svg\b/u);
      expect(sticker.skeletonSvg).not.toMatch(
        /<(?:script|foreignObject|image|audio|video|iframe|object|embed|a)\b/iu,
      );
      expect(sticker.skeletonSvg).not.toMatch(/\son\w+=|(?:javascript:|data:)|url\((?!['"]?#)/iu);
      for (const match of sticker.skeletonSvg.matchAll(/(?:href|xlink:href)="([^"]*)"/giu)) {
        expect(match[1]).toMatch(/^#/u);
      }
    }
  });

  it("generates one named React and Svelte export for every asset", async () => {
    const [reactIndex, svelteIndex] = await Promise.all([
      readFile(path.join(packageRoot, "src/react/index.tsx"), "utf8"),
      readFile(path.join(packageRoot, "src/svelte/index.ts"), "utf8"),
    ]);
    expect(reactIndex.match(/^export \{ default as \w+ \}/gmu)).toHaveLength(576);
    expect(svelteIndex.match(/^export \{ default as \w+ \}/gmu)).toHaveLength(576);
  });
});

describe("generated framework wrappers", () => {
  it("renders React static and SVG-only animated stickers with required alt text", () => {
    const StaticSticker = createStaticStickerComponent(phSilver001Sticker);
    const AnimatedSticker = createAnimatedStickerComponent(animatedChris001Sticker);
    const staticHtml = renderToStaticMarkup(createElement(StaticSticker, { alt: "Silver fox reaction" }));
    const animatedHtml = renderToStaticMarkup(
      createElement(AnimatedSticker, { alt: "Chris reaction", playback: "static" }),
    );
    expect(staticHtml).toContain('src="/stickers/ph-silver/');
    expect(staticHtml).toContain('alt="Silver fox reaction"');
    expect(animatedHtml).toContain("cf-animated-sticker__skeleton");
    expect(animatedHtml).toContain("<svg");
    expect(animatedHtml).not.toContain("<video");
  });

  it("renders equivalent Svelte wrappers during SSR", () => {
    const staticHtml = render(PhSilver001, { props: { alt: "Silver fox reaction" } }).body;
    const animatedHtml = render(AnimatedChris001, {
      props: { alt: "Chris reaction", playback: "static" },
    }).body;
    expect(staticHtml).toContain('src="/stickers/ph-silver/');
    expect(staticHtml).toContain('alt="Silver fox reaction"');
    expect(animatedHtml).toContain("cf-animated-sticker__skeleton");
    expect(animatedHtml).toContain("<svg");
    expect(animatedHtml).not.toContain("<video");
  });
});
