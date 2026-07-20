// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentStyles = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

describe("application and publishing CSS contracts", () => {
  it("keeps the application shell and content media primitives in the semantic stylesheet", () => {
    for (const selector of [
      ".cf-app-shell",
      ".cf-app-shell > main",
      ".cf-avatar",
      '.cf-avatar[data-size="sm"]',
      '.cf-avatar[data-size="lg"]',
      ".cf-inline-emoji",
      ".cf-media-grid",
      ".cf-media-grid > :where(li, figure)",
      ".cf-media-grid :where(img, video)",
      ".cf-media-grid :where(audio)",
      ".cf-search-result-card__tags",
    ]) {
      expect(componentStyles).toContain(selector);
    }
  });

  it("uses viewport growth, intrinsic inline emoji sizing, and bounded media", () => {
    expect(componentStyles).toMatch(/\.cf-app-shell\s*\{[^}]*min-block-size:\s*100vh/s);
    expect(componentStyles).toMatch(/\.cf-app-shell > main\s*\{[^}]*flex:\s*1 0 auto/s);
    expect(componentStyles).toMatch(/\.cf-inline-emoji\s*\{[^}]*inline-size:\s*1\.25em/s);
    expect(componentStyles).toMatch(/\.cf-media-grid :where\(img, video\)\s*\{[^}]*max-block-size:/s);
  });

  it("only swaps responsive image layers when dark artwork is present", () => {
    expect(componentStyles).toMatch(
      /:root\[data-theme="dark"\][^{]*\.cf-responsive-image\[data-has-dark-image="true"\][^{]*\.cf-responsive-image__light\s*\{[^}]*display:\s*none/s,
    );
    expect(componentStyles).toMatch(
      /:root\[data-theme="dark"\][^{]*\.cf-responsive-image\[data-has-dark-image="true"\][^{]*\.cf-responsive-image__dark\s*\{[^}]*display:\s*block/s,
    );
    expect(componentStyles).not.toMatch(
      /:root\[data-theme="dark"\]\s+\.cf-responsive-image__light\s*\{[^}]*display:\s*none/s,
    );
  });

  it("keeps consecutive chat messages compact and exposes only the final group avatar", () => {
    expect(componentStyles).toMatch(/\.cf-chat-thread\s*\{[^}]*gap:\s*var\(--cf-space-1\)/s);
    expect(componentStyles).toMatch(
      /\.cf-chat__row\[data-group-start="true"\]:not\(:first-child\)\s*\{[^}]*margin-block-start:\s*var\(--cf-space-2\)/s,
    );
    expect(componentStyles).toMatch(
      /\.cf-chat__row:not\(\[data-group-end="true"\]\) \.cf-chat__avatar\s*\{[^}]*visibility:\s*hidden/s,
    );
    expect(componentStyles).toContain('.cf-chat__row:not([data-group-start="true"]) .cf-chat__bubble');
    expect(componentStyles).toContain('.cf-chat__row:not([data-group-end="true"]) .cf-chat__bubble');
  });

  it("keeps avatar surfaces borderless and linked post cards keyboard-visible", () => {
    const avatarBlock = componentStyles.match(/\.cf-avatar\s*\{([^}]*)\}/s)?.[1] ?? "";
    const chatAvatarBlock = componentStyles.match(/\.cf-chat__avatar\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(avatarBlock).not.toMatch(/(^|\n)\s*border\s*:/);
    expect(chatAvatarBlock).not.toMatch(/(^|\n)\s*border\s*:/);
    expect(componentStyles).toContain(".cf-post-card:focus-visible");
    expect(componentStyles).toContain(".cf-latest-post-card:focus-visible");
    expect(componentStyles).toContain(".cf-search-result-card:focus-visible");
    expect(componentStyles).not.toContain(".cf-post-card__title a");
    expect(componentStyles).not.toContain(".cf-search-result-card__title a");
  });

  it("keeps footer content inset from narrow viewport edges", () => {
    expect(componentStyles).toMatch(/\.cf-footer\s*\{[^}]*padding-inline:\s*var\(--cf-space-4\)/s);
  });

  it("keeps alert blocks vertically compact across every tone", () => {
    expect(componentStyles).toMatch(
      /\.cf-alert\s*\{[^}]*padding:\s*var\(--cf-space-3\) var\(--cf-space-4\)/s,
    );
  });

  it("supports narrow, default, and full prose measures", () => {
    expect(componentStyles).toMatch(
      /\.cf-prose\s*\{[^}]*inline-size:\s*100%[^}]*max-inline-size:\s*var\(--cf-content-narrow\)/s,
    );
    expect(componentStyles).toMatch(
      /\.cf-prose\[data-size="default"\]\s*\{[^}]*max-inline-size:\s*var\(--cf-content-default\)/s,
    );
    expect(componentStyles).toMatch(/\.cf-prose\[data-size="full"\]\s*\{[^}]*max-inline-size:\s*none/s);
  });

  it("reduces large section rhythm alongside the tablet navbar", () => {
    expect(componentStyles).toMatch(
      /@media \(width < 64\.0625rem\)\s*\{[\s\S]*?\.cf-section\[data-spacing="lg"\]\s*\{[^}]*margin-block:\s*var\(--cf-space-10\)/,
    );
  });
});
