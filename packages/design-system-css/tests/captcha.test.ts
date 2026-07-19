import { describe, expect, it } from "vitest";
import { CAPTCHA_LABELS } from "../src/captcha.js";
import type { CaptchaLabels, CaptchaState } from "../src/types.js";

describe("Captcha visual contract", () => {
  it("defines stable copy for every controlled visual state", () => {
    const states: CaptchaState[] = ["idle", "verifying", "success", "error"];

    expect(Object.keys(CAPTCHA_LABELS)).toEqual(states);
    for (const state of states) expect(CAPTCHA_LABELS[state]).toBeTruthy();
    expect(Object.isFrozen(CAPTCHA_LABELS)).toBe(true);
  });

  it("accepts a complete localized label contract", () => {
    const labels: CaptchaLabels = {
      idle: "Start",
      verifying: "Working",
      success: "Done",
      error: "Retry",
    };

    expect(labels.success).toBe("Done");
  });
});
