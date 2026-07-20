import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import { parseTgs } from "../src/tgs.js";

function tgs(overrides: Record<string, unknown> = {}): Buffer {
  return gzipSync(
    JSON.stringify({
      v: "5.12.1",
      w: 512,
      h: 512,
      fr: 60,
      ip: 0,
      op: 120,
      layers: [{ ty: 4, shapes: [] }],
      ...overrides,
    }),
  );
}

describe("Telegram TGS validation", () => {
  it("accepts a bounded vector animation", () => {
    const parsed = parseTgs(tgs({ ip: 57, op: 215 }));

    expect(parsed.frameCount).toBe(158);
    expect(parsed.duration).toBeCloseTo(158 / 60);
    expect(parsed.animation.w).toBe(512);
  });

  it("rejects invalid gzip and metadata outside Telegram's contract", () => {
    expect(() => parseTgs(Buffer.from("not gzip"))).toThrow(/gzip-compressed/u);
    expect(() => parseTgs(tgs({ w: 256 }))).toThrow(/512×512/u);
    expect(() => parseTgs(tgs({ fr: 30 }))).toThrow(/60 fps/u);
    expect(() => parseTgs(tgs({ op: 181 }))).toThrow(/3 seconds/u);
    expect(() => parseTgs(tgs({ op: 120.5 }))).toThrow(/whole-frame/u);
    expect(() => parseTgs(tgs({ v: undefined }))).toThrow(/Lottie version/u);
    expect(() => parseTgs(tgs({ layers: undefined }))).toThrow(/layers array/u);
  });

  it("rejects raster, text, 3D, and external asset references", () => {
    expect(() => parseTgs(tgs({ layers: [{ ty: 2 }] }))).toThrow(/images, text, 3D/u);
    expect(() => parseTgs(tgs({ layers: [{ ty: 5 }] }))).toThrow(/images, text, 3D/u);
    expect(() => parseTgs(tgs({ layers: [{ ty: 4, ddd: 1 }] }))).toThrow(/images, text, 3D/u);
    expect(() => parseTgs(tgs({ assets: [{ id: "image", p: "photo.png", u: "images/" }] }))).toThrow(
      /external asset/u,
    );
  });
});
