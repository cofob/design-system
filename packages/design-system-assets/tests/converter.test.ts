import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { afterEach, describe, expect, it } from "vitest";

import { convertTgs } from "../src/index.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("TGS conversion", () => {
  it("emits one transparent WebM and a manifest with an inline first-frame SVG", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "cf-tgs-test-"));
    temporaryDirectories.push(outputDir);
    const manifest = await convertTgs({
      input: fileURLToPath(new URL("./fixtures/animated_chris_agaddieaah8nsuk.tgs", import.meta.url)),
      outputDir,
      publicBase: "/stickers/animated-chris",
      name: "animated-chris",
    });

    expect(manifest.version).toBe(1);
    expect(manifest.sticker.src).toMatch(/^\/stickers\/animated-chris\/animated-chris\.[a-f0-9]{12}\.webm$/u);
    expect(manifest.sticker.skeletonSvg).toMatch(/^<svg\b/u);
    expect(manifest.sticker.skeletonSvg).toContain('viewBox="0 0 512 512"');
    expect(manifest.sticker.skeletonSvg).toContain('focusable="false"');
    expect(manifest.sticker.skeletonSvg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(manifest.sticker.skeletonSvg).not.toMatch(
      /<(?:script|foreignObject|image|iframe|object|embed|a)\b/iu,
    );
    expect(manifest.sticker.skeletonSvg).not.toMatch(
      /(?:data:|javascript:|\son\w+=|url\((?!['"]?#)|(?:href|xlink:href)=["'](?!#))/iu,
    );
    expect(manifest.media).toMatchObject({ type: "video/webm", fps: 60, frameCount: 158 });
    expect(manifest.media.duration).toBeCloseTo(158 / 60);

    const files = (await readdir(outputDir)).sort();
    expect(files).toHaveLength(2);
    expect(files).toContain("animated-chris.manifest.json");
    const webmName = path.basename(manifest.sticker.src);
    expect(files).toContain(webmName);

    const writtenManifest = JSON.parse(
      await readFile(path.join(outputDir, "animated-chris.manifest.json"), "utf8"),
    ) as typeof manifest;
    expect(writtenManifest).toEqual(manifest);
    expect(writtenManifest.sticker.skeletonSvg).toMatch(/^<svg\b/u);

    const probe = spawnSync(
      "ffprobe",
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", path.join(outputDir, webmName)],
      { encoding: "utf8", shell: false },
    );
    expect(probe.status, probe.stderr).toBe(0);
    const metadata = JSON.parse(probe.stdout) as {
      streams: Array<Record<string, unknown>>;
      format: { duration?: string };
    };
    const video = metadata.streams.find((stream) => stream.codec_type === "video");
    expect(video).toMatchObject({ codec_name: "vp9", width: 512, height: 512, avg_frame_rate: "60/1" });
    expect(video?.tags).toMatchObject({ ALPHA_MODE: "1" });
    expect(metadata.streams.some((stream) => stream.codec_type === "audio")).toBe(false);
    expect(Number(metadata.format.duration)).toBeCloseTo(158 / 60, 2);

    const decoded = spawnSync(
      "ffmpeg",
      [
        "-v",
        "error",
        "-c:v",
        "libvpx-vp9",
        "-i",
        path.join(outputDir, webmName),
        "-frames:v",
        "1",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgba",
        "pipe:1",
      ],
      { maxBuffer: 2_000_000, shell: false },
    );
    expect(decoded.status, decoded.stderr.toString()).toBe(0);
    expect(decoded.stdout.byteLength).toBe(512 * 512 * 4);

    const svgImage = await loadImage(Buffer.from(manifest.sticker.skeletonSvg));
    const canvas = createCanvas(512, 512);
    const context = canvas.getContext("2d");
    context.drawImage(svgImage, 0, 0, 512, 512);
    const svgPixels = context.getImageData(0, 0, 512, 512).data;
    let premultipliedError = 0;
    for (let index = 0; index < svgPixels.length; index += 4) {
      const svgAlpha = svgPixels[index + 3] ?? 0;
      const webmAlpha = decoded.stdout[index + 3] ?? 0;
      premultipliedError += Math.abs(svgAlpha - webmAlpha);
      for (let channel = 0; channel < 3; channel += 1) {
        const svgValue = svgPixels[index + channel] ?? 0;
        const webmValue = decoded.stdout[index + channel] ?? 0;
        premultipliedError += Math.abs((svgValue * svgAlpha) / 255 - (webmValue * webmAlpha) / 255);
      }
    }
    expect(premultipliedError / svgPixels.length).toBeLessThan(8);
  });
});
