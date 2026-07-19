// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("SSR safety", () => {
  it("imports and initializes without DOM globals", async () => {
    const designSystem = await import("../src/index.js");
    expect(designSystem.THEME_STORAGE_KEY).toBe("cf-theme");
    const controller = designSystem.initDesignSystem();
    expect(controller.theme.getPreference()).toBe("system");
    controller.destroy();
  });
});
