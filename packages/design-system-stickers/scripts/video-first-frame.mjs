import { spawnSync } from "node:child_process";

import sharp from "sharp";

export const VIDEO_FIRST_FRAME_SIZE = 192;

export async function renderVideoFirstFrameWebp(filename) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      filename,
      "-vf",
      `scale=${VIDEO_FIRST_FRAME_SIZE}:${VIDEO_FIRST_FRAME_SIZE}:force_original_aspect_ratio=decrease,pad=${VIDEO_FIRST_FRAME_SIZE}:${VIDEO_FIRST_FRAME_SIZE}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`,
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
  if (result.status !== 0) {
    throw new Error(`Could not decode the first video frame: ${result.stderr.toString()}`);
  }
  const expected = VIDEO_FIRST_FRAME_SIZE * VIDEO_FIRST_FRAME_SIZE * 4;
  if (result.stdout.byteLength !== expected) {
    throw new Error(`Decoded video frame has ${result.stdout.byteLength} bytes; expected ${expected}.`);
  }
  return sharp(result.stdout, {
    raw: {
      width: VIDEO_FIRST_FRAME_SIZE,
      height: VIDEO_FIRST_FRAME_SIZE,
      channels: 4,
    },
  })
    .webp({ quality: 82, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer();
}
