import type { CaptchaLabels } from "./types.js";

/** Default English copy shared by the native, React, and Svelte examples. */
export const CAPTCHA_LABELS: Readonly<CaptchaLabels> = Object.freeze({
  idle: "Verify you are human",
  verifying: "Verifying…",
  success: "Verification complete",
  error: "Verification failed",
});
