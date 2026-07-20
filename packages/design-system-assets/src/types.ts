export interface AnimatedStickerModel {
  src: string;
  /** Sanitized inline SVG markup generated from the first composition frame. */
  skeletonSvg: string;
  width: number;
  height: number;
}

export interface TgsConversionManifest {
  version: 1;
  sticker: AnimatedStickerModel;
  media: {
    type: "video/webm";
    fps: number;
    frameCount: number;
    duration: number;
    webmBytes: number;
  };
  hashes: {
    sourceSha256: string;
    webmSha256: string;
    skeletonSvgSha256: string;
  };
}

export interface ConvertTgsOptions {
  /** Local `.tgs` file path or file URL. */
  input: string | URL;
  /** Directory that receives the WebM and JSON manifest. */
  outputDir: string | URL;
  /** Public URL prefix recorded in `manifest.sticker.src`. Defaults to `./`. */
  publicBase?: string;
  /** Safe output basename. Defaults to the input filename. */
  name?: string;
  /** FFmpeg executable path. Defaults to `ffmpeg` on PATH. */
  ffmpegPath?: string;
  /** libvpx-vp9 constant-quality value from 0–63. Defaults to 28. */
  crf?: number;
  /** Square output size in pixels. Defaults to the Telegram composition size (512). Must be even. */
  size?: number;
  /** Accept legacy 30 fps Telegram packs. Defaults to false; current Telegram validation remains 60 fps. */
  allowLegacyFps?: boolean;
}
