import { gunzipSync } from "node:zlib";

const MAX_TGS_BYTES = 64 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;

export interface TgsAnimationData extends Record<string, unknown> {
  w: number;
  h: number;
  fr: number;
  ip: number;
  op: number;
}

export interface ParsedTgs {
  animation: TgsAnimationData;
  duration: number;
  frameCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function containsForbiddenLayer(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenLayer);
  if (!isRecord(value)) return false;

  if (value.ty === 2 || value.ty === 5 || value.ddd === 1) return true;
  if (typeof value.u === "string" || typeof value.p === "string" || value.e === 1) return true;
  return Object.values(value).some(containsForbiddenLayer);
}

export function parseTgs(buffer: Uint8Array, options: { allowLegacyFps?: boolean } = {}): ParsedTgs {
  if (buffer.byteLength === 0) throw new Error("TGS input is empty.");
  if (buffer.byteLength > MAX_TGS_BYTES) {
    throw new Error(`TGS input exceeds Telegram's ${MAX_TGS_BYTES}-byte limit.`);
  }

  let json: Buffer;
  try {
    json = gunzipSync(buffer, { maxOutputLength: MAX_JSON_BYTES });
  } catch (error) {
    throw new Error("TGS input is not valid gzip-compressed Lottie JSON.", { cause: error });
  }

  let value: unknown;
  try {
    value = JSON.parse(json.toString("utf8"));
  } catch (error) {
    throw new Error("TGS payload is not valid JSON.", { cause: error });
  }
  if (!isRecord(value)) throw new Error("TGS payload must be a Lottie object.");
  if (typeof value.v !== "string" || value.v.length === 0 || !Array.isArray(value.layers)) {
    throw new Error("TGS payload must contain a Lottie version and layers array.");
  }

  const { w, h, fr, ip, op } = value;
  if (w !== 512 || h !== 512) throw new Error("Telegram TGS stickers must be exactly 512×512 pixels.");
  if (fr !== 60 && !(options.allowLegacyFps && fr === 30)) {
    throw new Error("Telegram TGS stickers must use 60 fps.");
  }
  if (!finiteNumber(ip) || !finiteNumber(op) || !Number.isInteger(ip) || !Number.isInteger(op) || op <= ip) {
    throw new Error("TGS animation must have a finite, positive whole-frame range.");
  }

  const duration = (op - ip) / fr;
  if (duration > 3) throw new Error("Telegram TGS stickers must not exceed 3 seconds.");
  if (containsForbiddenLayer(value)) {
    throw new Error("TGS contains images, text, 3D layers, or external asset references.");
  }

  return {
    animation: value as TgsAnimationData,
    duration,
    frameCount: Math.ceil(op - ip),
  };
}
