import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import componentGroups from "../../apps/showroom/src/data/components.json" with { type: "json" };

const accessibilityRoutes = [
  "/",
  "/components/",
  "/foundations/",
  "/accessibility/",
  "/installation/",
  "/migration/",
];
const frameworkNames = ["Native", "React", "Svelte"] as const;
const componentRoutes = componentGroups.flatMap((group) =>
  group.components.map(
    (component) => `/components/${component.name.replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}/`,
  ),
);

test("pages expose generated social previews", async ({ page, request }) => {
  for (const route of ["/", "/foundations/", "/components/button/"]) {
    await page.goto(route);

    const canonicalUrl = new URL(route, "https://design.cofob.dev").href;
    const expectedImagePath = route === "/" ? "/og/index.png" : `/og${route.replace(/\/$/, "")}.png`;
    const imageUrl = new URL(expectedImagePath, "https://design.cofob.dev").href;

    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonicalUrl);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", imageUrl);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

    const imageResponse = await request.get(expectedImagePath);
    expect(imageResponse.ok()).toBe(true);
    expect(imageResponse.headers()["content-type"]).toBe("image/png");
    expect((await imageResponse.body()).subarray(1, 4).toString()).toBe("PNG");
  }
});

const parityFixtures = [
  { slug: "heading", text: ["Content comes first."] },
  {
    slug: "text",
    text: ["Readable body text for long-form content.", "Supporting metadata stays quiet."],
  },
  { slug: "link", text: ["Read the installation guide"] },
  {
    slug: "prose",
    text: [
      "Long-form rhythm",
      "Headings, paragraphs, links, and inline code share a comfortable reading measure.",
    ],
  },
  { slug: "container", text: ["A centered, narrow content container."] },
  {
    slug: "section",
    text: [
      "Foundation",
      "A clear section",
      "Semantic page rhythm.",
      "Section content follows its optional header.",
    ],
  },
  { slug: "stack", text: ["First", "Second", "Third"] },
  { slug: "inline", text: ["One", "Two", "Three"] },
  {
    slug: "field",
    text: ["Project name", "Use a short, recognizable name.", "Slug", "A slug is required."],
  },
  {
    slug: "textarea",
    text: ["Note", "20 characters", "Required summary", "A summary is required.", "Disabled"],
  },
  {
    slug: "select",
    text: [
      "Theme preference",
      "Choose how the interface resolves color.",
      "Invalid selection",
      "Choose an available option.",
      "Disabled",
    ],
  },
  {
    slug: "captcha",
    text: ["Verify you are human", "Verifying…", "Verification complete", "Verification failed"],
  },
  { slug: "tag", text: ["taxonomy", "design systems"] },
  {
    slug: "card",
    text: [
      "Default",
      "Quiet structure.",
      "Elevated",
      "Raised context.",
      "Outlined",
      "Defined boundary.",
      "Interactive",
      "Linked surface.",
    ],
  },
  { slug: "empty-state", text: ["No posts yet", "Publish the first note", "Create a post"] },
  {
    slug: "code-block",
    text: ['const preference = "system";', "applyTheme(preference);", "typescript", "Copy"],
  },
  {
    slug: "terminal-code-block",
    text: [
      "Terminal",
      "npm install @cofob/design-system-css",
      "added 1 package in 842ms",
      "npm run build",
      "✓ 51 pages built",
      "Copy command",
    ],
  },
] as const;

function expectNoAxeViolations(context: string, violations: readonly unknown[]) {
  expect(violations, `${context}\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
}

async function selectFramework(page: Page, framework: (typeof frameworkNames)[number]) {
  const adapter = framework.toLowerCase();
  const tab = page.locator(".astro-framework-tabs").getByRole("tab", { name: framework, exact: true });
  await tab.click();
  const panel = page.locator(`[data-framework-panel="${adapter}"]`);
  await expect(panel).toBeVisible();
  const island = panel.locator("astro-island");
  if ((await island.count()) > 0) await expect(island).not.toHaveAttribute("ssr", "");
  return panel;
}

async function visibleShowroomThemeToggle(page: Page) {
  const toggle = page.locator("[data-showroom-theme]");
  if (!(await toggle.isVisible())) {
    const menuToggle = page.locator("header [data-cf-navbar-trigger]");
    await menuToggle.click();
    await expect(toggle).toBeVisible();
  }
  return toggle;
}

async function previewSignature(panel: Locator) {
  return panel.evaluate((root) => {
    const normalize = (value: string | null | undefined) => value?.replaceAll(/\s+/g, " ").trim() ?? "";
    const visible = (element: Element) => {
      const node = element as HTMLElement;
      const style = getComputedStyle(node);
      const bounds = node.getBoundingClientRect();
      return (
        style.display !== "none" && style.visibility !== "hidden" && bounds.width > 0 && bounds.height > 0
      );
    };
    const controls = Array.from(root.querySelectorAll("a, button, input, select, textarea, summary"))
      .filter(visible)
      .map((element) => {
        const control = element as HTMLInputElement;
        const summary = element instanceof HTMLElement && element.tagName === "SUMMARY";
        const tag = summary ? "button" : element.tagName.toLowerCase();
        const hasOwnVisibleName = tag === "a" || tag === "button";
        return {
          tag,
          type: summary ? "button" : control.type || "",
          name: hasOwnVisibleName
            ? normalize(
                element.getAttribute("aria-label") ??
                  element.getAttribute("title") ??
                  (element as HTMLElement).innerText,
              )
            : "",
          placeholder: "placeholder" in control ? control.placeholder : "",
          value: "value" in control ? control.value : "",
          checked: "checked" in control ? control.checked : false,
          disabled: "disabled" in control ? control.disabled : false,
          expanded: summary
            ? String(Boolean(element.closest("details")?.open))
            : (element.getAttribute("aria-expanded") ?? ""),
        };
      });
    const images = Array.from(root.querySelectorAll("img"))
      .filter(visible)
      .map((image) => ({ alt: image.alt, width: image.width, height: image.height }));

    return { text: normalize((root as HTMLElement).innerText), controls, images };
  });
}

async function selectEveryOverviewFramework(
  page: Page,
  framework: Exclude<(typeof frameworkNames)[number], "Native">,
) {
  const cards = page.locator(".astro-component-card");
  await expect(cards).toHaveCount(componentRoutes.length);

  for (let index = 0; index < componentRoutes.length; index += 1) {
    const card = cards.nth(index);
    await card.locator(".astro-framework-tabs").getByRole("tab", { name: framework, exact: true }).click();
    const panel = card.locator(`[data-framework-panel="${framework.toLowerCase()}"]`);
    await expect(panel).toBeVisible();
    await expect(panel.locator("astro-island")).not.toHaveAttribute("ssr", "");
  }

  await page.mouse.move(0, 0);
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.waitForTimeout(250);
}

test("documents every public component", async ({ page }) => {
  await page.goto("/components/");
  const cards = page.locator(".astro-component-card");
  await expect(cards).toHaveCount(componentRoutes.length);
  await expect(page.getByRole("link", { name: "Dialog API and examples" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sticker API and examples" })).toBeVisible();
});

test("component API pages expose detailed examples and complete parameter tables", async ({ page }) => {
  for (const route of componentRoutes) {
    await page.goto(route);
    const componentName = route
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.split("-")
      .map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`)
      .join("");

    await expect(page.getByRole("heading", { name: "React", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Svelte", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "HTML", exact: true })).toBeVisible();
    await expect(page.locator(".astro-code-block")).toHaveCount(3);
    await expect(page.locator(".astro-detail-grid > section > .astro-code-block .cf-code-copy")).toHaveCount(
      3,
    );
    await expect(page.locator(".astro-parameter-table tbody tr").first()).toBeVisible();
    await expect(page.locator(".astro-code").first()).toContainText(
      `Complete ${componentName} parameter reference`,
    );
  }
});

test("framework exploration actions are real links", async ({ page }) => {
  await page.goto("/");
  for (const framework of ["React", "Svelte"] as const) {
    const link = page.getByRole("link", { name: `Explore ${framework}`, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/components/");
  }
});

test("SkipLink is the first keyboard stop and moves focus to main content", async ({ page }) => {
  await page.goto("/");
  const skipLink = page.getByRole("link", { name: "Skip to content", exact: true });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

test("tablet and mobile navigation expands from an accessible toggle", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "Toggle navigation menu" });
  const navbar = page.getByRole("navigation", { name: "Primary navigation" });
  const navigation = navbar.locator("[data-cf-navbar-panel]");
  const headerPadding = await navbar.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      blockStart: Number.parseFloat(style.paddingBlockStart),
      blockEnd: Number.parseFloat(style.paddingBlockEnd),
    };
  });
  const pageWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(headerPadding.blockStart).toBeGreaterThan(0);
  expect(headerPadding.blockEnd).toBeGreaterThan(0);
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();

  const contentTop = (await page.locator("#content").boundingBox())?.y;
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();
  expect((await page.locator("#content").boundingBox())?.y).toBe(contentTop);

  await page.mouse.click(8, 850);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();

  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(navigation).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(toggle).toBeHidden();
  await expect(navigation).toBeVisible();
});

test("documentation pages share the showroom alignment and highlighted code treatment", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/accessibility/");
  const referenceX = (await page.locator(".astro-hero").boundingBox())?.x;

  for (const route of ["/installation/", "/migration/"]) {
    await page.goto(route);
    expect((await page.locator(".astro-hero").boundingBox())?.x).toBe(referenceX);
  }

  await page.goto("/installation/");
  const code = page.locator(".astro-code").first();
  await expect(code).toBeVisible();
  expect(await code.locator("span[style]").count()).toBeGreaterThan(2);
});

test("Design principles heading remains a single readable line at the reference width", async ({ page }) => {
  await page.setViewportSize({ width: 920, height: 700 });
  await page.goto("/");
  const heading = page.locator("#principles-heading");
  const metrics = await heading.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(style.lineHeight),
    };
  });
  expect(metrics.height).toBeLessThan(metrics.lineHeight * 1.5);
});

test("component overview switches Native, React, and Svelte previews independently", async ({ page }) => {
  await page.goto("/components/");
  const themeCard = page.locator("#theme-provider");
  const buttonCard = page.locator("#button");

  await expect(themeCard.locator('[data-framework-panel="native"]')).toBeVisible();
  await themeCard.getByRole("tab", { name: "React", exact: true }).click();
  await expect(themeCard.locator('[data-framework-panel="react"]')).toBeVisible();
  await expect(themeCard.locator('[data-framework-panel="react"] astro-island')).not.toHaveAttribute(
    "ssr",
    "",
  );

  await themeCard.getByRole("tab", { name: "Svelte", exact: true }).click();
  await expect(themeCard.locator('[data-framework-panel="svelte"]')).toBeVisible();
  await expect(themeCard.locator('[data-framework-panel="svelte"] astro-island')).not.toHaveAttribute(
    "ssr",
    "",
  );

  await expect(buttonCard.getByRole("tab", { name: "Native", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(buttonCard.locator('[data-framework-panel="native"]')).toBeVisible();
});

test("compact previews preserve the component typography across adapters", async ({ page }) => {
  await page.goto("/components/");

  const cases = [
    { card: "blue-line", selector: ".cf-heading", tag: "H3" },
    { card: "post-card", selector: ".cf-post-card__title", tag: "H2" },
    { card: "latest-post-card", selector: ".cf-latest-post-card__title", tag: "H2" },
    { card: "search-result-card", selector: ".cf-search-result-card__title", tag: "H2" },
  ] as const;

  for (const item of cases) {
    const card = page.locator(`#${item.card}`);
    const styles: Array<{ fontSize: string; lineHeight: string; tag: string }> = [];
    for (const framework of frameworkNames) {
      await card.getByRole("tab", { name: framework, exact: true }).click();
      const panel = card.locator(`[data-framework-panel="${framework.toLowerCase()}"]`);
      await expect(panel).toBeVisible();
      const island = panel.locator("astro-island");
      if ((await island.count()) > 0) await expect(island).not.toHaveAttribute("ssr", "");
      styles.push(
        await panel
          .locator(item.selector)
          .first()
          .evaluate((element) => ({
            fontSize: getComputedStyle(element).fontSize,
            lineHeight: getComputedStyle(element).lineHeight,
            tag: element.tagName,
          })),
      );
    }

    expect(new Set(styles.map((style) => style.fontSize)).size).toBe(1);
    expect(new Set(styles.map((style) => style.lineHeight)).size).toBe(1);
    expect(styles.map((style) => style.tag)).toEqual([item.tag, item.tag, item.tag]);
  }
});

test("preview dots and form states remain visible in every implementation", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("cf-theme", "light"));
  await page.goto("/components/text-field/");
  const sveltePanel = await selectFramework(page, "Svelte");
  const svelteFields = sveltePanel.locator(".cf-input");
  await expect(svelteFields).toHaveCount(3);
  await expect(svelteFields.nth(1)).toHaveCSS("border-color", "rgb(185, 28, 28)");
  await expect(svelteFields.nth(2)).toHaveCSS("opacity", "0.7");
  await expect(svelteFields.nth(2).locator("input")).toBeDisabled();

  const previewBackground = await sveltePanel.locator(".astro-demo").evaluate((element) => {
    const style = getComputedStyle(element);
    return { image: style.backgroundImage, size: style.backgroundSize };
  });
  expect(previewBackground.image).toContain("radial-gradient");
  expect(previewBackground.size).toBe("12px 12px");

  await page.goto("/components/select/");
  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    const arrows = await panel
      .locator("select")
      .evaluateAll((selects) => selects.map((select) => getComputedStyle(select).backgroundImage));
    expect(arrows).toHaveLength(3);
    expect(arrows.every((background) => background !== "none")).toBe(true);
  }
});

test("ChatThread keeps its background dots visible in the light theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("cf-theme", "light"));
  await page.goto("/components/chat-thread/");

  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    const background = await panel.locator(".cf-chat-thread").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        image: style.backgroundImage,
        dot: style.getPropertyValue("--cf-color-chat-dot").trim(),
        softDot: style.getPropertyValue("--cf-color-chat-dot-soft").trim(),
      };
    });
    expect(background.image).toContain("radial-gradient");
    expect(background.dot).toBe("rgba(3,105,161,.18)");
    expect(background.softDot).toBe("rgba(3,105,161,.12)");
  }
});

test("CodeBlock and TerminalCodeBlock copy only their explicit sources", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(value: string) {
          (window as typeof window & { __cfCopiedText?: string }).__cfCopiedText = value;
          return Promise.resolve();
        },
      },
    });
  });

  await page.goto("/components/code-block/");
  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    await expect(panel.locator(".cf-code-block__language")).toHaveText("typescript");
    await panel.getByRole("button", { name: "Copy typescript code", exact: true }).click();
    await expect(panel.locator(".cf-code-copy")).toHaveAttribute("data-copy-state", "copied");
    expect(
      await page.evaluate(() => (window as typeof window & { __cfCopiedText?: string }).__cfCopiedText),
    ).toBe('const preference = "system";\napplyTheme(preference);');
  }

  await page.goto("/components/terminal-code-block/");
  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    const firstEntry = panel.locator(".cf-terminal-code-block__entry").first();
    const command = firstEntry.locator(".cf-terminal-code-block__command");
    const commandDimensions = await command.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(commandDimensions.scrollWidth).toBeLessThanOrEqual(commandDimensions.clientWidth + 1);
    expect(await command.evaluate((element) => element.textContent)).toBe(
      "npm install @cofob/design-system-css",
    );
    await expect(command.locator('[data-token="command"]')).toHaveText("npm");
    await expect(firstEntry.locator(".cf-terminal-code-block__output .cf-syntax-token")).toHaveCount(0);
    expect(
      await firstEntry.locator(".cf-terminal-code-block__output").evaluate((element) => element.textContent),
    ).toBe("added 1 package in 842ms");
    await firstEntry.getByRole("button", { name: "Copy command 1", exact: true }).click();
    await expect(firstEntry.locator(".cf-code-copy")).toHaveAttribute("data-copy-state", "copied");
    expect(
      await page.evaluate(() => (window as typeof window & { __cfCopiedText?: string }).__cfCopiedText),
    ).toBe("npm install @cofob/design-system-css");
    await expect(firstEntry.locator(".cf-terminal-code-block__output")).toContainText(
      "added 1 package in 842ms",
    );
  }
});

test("Native, React, and Svelte parity fixtures present the same content", async ({ page }) => {
  test.setTimeout(120_000);

  for (const fixture of parityFixtures) {
    await page.goto(`/components/${fixture.slug}/`);
    for (const framework of frameworkNames) {
      const panel = await selectFramework(page, framework);
      for (const text of fixture.text) {
        await expect(panel.getByText(text, { exact: false }).first()).toBeVisible();
      }
      if (fixture.slug === "select") {
        await expect(panel.getByLabel("Invalid selection")).toHaveValue("");
      }
    }
  }
});

test("all Native, React, and Svelte examples expose the same visible fixture contract", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("cf-theme", "system"));
  const mismatches: Array<{
    route: string;
    framework: "React" | "Svelte";
    native: Awaited<ReturnType<typeof previewSignature>>;
    actual: Awaited<ReturnType<typeof previewSignature>>;
  }> = [];

  for (const route of componentRoutes) {
    await page.goto(route);
    const signatures = [];
    for (const framework of frameworkNames) {
      signatures.push({
        framework,
        signature: await previewSignature(await selectFramework(page, framework)),
      });
    }
    const native = signatures[0]?.signature;
    const react = signatures[1]?.signature;
    const svelte = signatures[2]?.signature;
    if (native && react && JSON.stringify(react) !== JSON.stringify(native)) {
      mismatches.push({ route, framework: "React", native, actual: react });
    }
    if (native && svelte && JSON.stringify(svelte) !== JSON.stringify(native)) {
      mismatches.push({ route, framework: "Svelte", native, actual: svelte });
    }
  }

  expect(mismatches).toEqual([]);
});

test("Captcha exposes identical controlled visual states in every adapter", async ({ page }) => {
  await page.goto("/components/captcha/");
  const signatures: Awaited<ReturnType<typeof previewSignature>>[] = [];

  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    const captchas = panel.locator(".cf-captcha");
    await expect(captchas).toHaveCount(5);
    await expect(captchas.nth(0)).toHaveAttribute("data-state", "idle");
    await expect(captchas.nth(1)).toHaveAttribute("data-state", "verifying");
    await expect(captchas.nth(2)).toHaveAttribute("data-state", "success");
    await expect(captchas.nth(3)).toHaveAttribute("data-state", "error");
    await expect(captchas.nth(4)).toBeDisabled();
    await expect(panel.locator(".cf-captcha__brand")).toHaveCount(0);
    signatures.push(await previewSignature(panel));
  }

  expect(signatures[1]).toEqual(signatures[0]);
  expect(signatures[2]).toEqual(signatures[0]);
});

test("Captcha showroom simulation ignores repeated starts and supports success, error, and retry", async ({
  page,
}) => {
  await page.goto("/components/captcha/");
  const demo = page.locator("[data-captcha-interactive]");
  const captcha = demo.locator(".cf-captcha");
  const liveStatus = captcha.locator(":scope > .cf-visually-hidden");

  const runSimulation = async (randomValue: number, expectedState: "success" | "error") => {
    await page.evaluate((value) => {
      Math.random = () => value;
    }, randomValue);
    await captcha.click();
    await expect(captcha).toHaveAttribute("data-state", "verifying");
    await expect(captcha).toHaveAttribute("aria-busy", "true");

    await captcha.click();
    await page.waitForTimeout(1_000);
    await expect(captcha).toHaveAttribute("data-state", "verifying");

    await expect.poll(() => captcha.getAttribute("data-state"), { timeout: 2_000 }).toBe(expectedState);
    await expect(captcha).not.toHaveAttribute("aria-busy", "true");
    await expect(liveStatus).toHaveText(
      expectedState === "success" ? "Verification complete" : "Verification failed",
    );
  };

  await expect(captcha).toHaveAttribute("data-state", "idle");
  await runSimulation(0.25, "success");
  await runSimulation(0.75, "error");
});

test("Captcha detail blocks keep the shared vertical rhythm", async ({ page }) => {
  await page.goto("/components/captcha/");
  const content = page.locator(".astro-detail-grid > section");
  const simulation = content.locator(":scope > [data-captcha-interactive]");
  const attribution = content.locator(":scope > .cf-alert");
  const usage = content.getByRole("heading", { name: "Usage", exact: true });
  const [simulationBox, attributionBox, usageBox] = await Promise.all([
    simulation.boundingBox(),
    attribution.boundingBox(),
    usage.boundingBox(),
  ]);

  expect(simulationBox).not.toBeNull();
  expect(attributionBox).not.toBeNull();
  expect(usageBox).not.toBeNull();
  if (simulationBox && attributionBox && usageBox) {
    expect(attributionBox.y - (simulationBox.y + simulationBox.height)).toBeGreaterThanOrEqual(20);
    expect(usageBox.y - (attributionBox.y + attributionBox.height)).toBeGreaterThanOrEqual(20);
  }
});

test("native loading button uses the shared spinner and label contract", async ({ page }) => {
  await page.goto("/components/button/");
  const panel = await selectFramework(page, "Native");
  const loadingButton = panel.getByRole("button", { name: "Loading", exact: true });

  await expect(loadingButton.locator(".cf-button__spinner")).toHaveCount(1);
  await expect(loadingButton.locator(".cf-button__label")).toHaveText("Loading");
  await expect(loadingButton).toHaveAttribute("aria-busy", "true");
});

test("Sticker includes the attributed cofob.dev image example in every adapter", async ({ page }) => {
  await page.goto("/components/sticker/");

  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    const image = panel.getByRole("img", {
      name: "A fox looking pleased with itself beneath the Russian caption ‘Как же я хорош’",
    });
    await expect(image).toHaveAttribute("src", "/stickers/fox_pack/ya_ahuenen.webp");
    await expect(image).toHaveAttribute("width", "192");
    await expect(image).toHaveAttribute("height", "192");
    await expect(image.locator("xpath=..")).toHaveAttribute("data-image", "true");

    const attribution = panel.getByRole("link", { name: "PhSilver sticker pack", exact: true });
    await expect(attribution).toHaveAttribute("href", "https://t.me/addstickers/PhSilver");
    await expect(attribution).toHaveAttribute("target", "_blank");
    await expect(attribution).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("BlueLine preserves the original marker geometry and motion in every adapter", async ({ page }) => {
  await page.goto("/components/blue-line/");
  const sizes: Array<{ width: number; height: number }> = [];

  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    const line = panel.locator(".cf-blue-line").first();
    await expect(line.locator(".cf-blue-line__content")).toHaveText("cofob.dev.");
    const inlineLayout = await panel.locator(".astro-blue-line-preview").evaluate((heading) => {
      const line = heading.querySelector<HTMLElement>(".cf-blue-line");
      const leadingText = [...heading.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.includes("Hello"),
      );
      if (!line || !leadingText) throw new Error("Expected inline marker example content");
      const range = document.createRange();
      range.selectNodeContents(leadingText);
      return {
        text: heading.textContent?.replaceAll(/\s+/g, " ").trim(),
        leadingTop: range.getBoundingClientRect().top,
        markerTop: line.getBoundingClientRect().top,
      };
    });
    expect(inlineLayout.text).toBe("Hello, cofob.dev.");
    expect(Math.abs(inlineLayout.leadingTop - inlineLayout.markerTop)).toBeLessThan(8);
    const metrics = await line.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const marker = getComputedStyle(element, "::before");
      return {
        width: bounds.width,
        height: bounds.height,
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
        markerWidth: Number.parseFloat(marker.width),
        markerHeight: Number.parseFloat(marker.height),
        right: Number.parseFloat(marker.right),
        bottom: Number.parseFloat(marker.bottom),
        background: marker.backgroundColor,
        animation: marker.animationName,
        transformOriginX: Number.parseFloat(marker.transformOrigin),
        marginInlineEnd: Number.parseFloat(getComputedStyle(element).marginInlineEnd),
        whiteSpace: getComputedStyle(element).whiteSpace,
      };
    });
    expect(metrics.markerWidth / metrics.width).toBeCloseTo(0.75, 1);
    expect(metrics.markerHeight / metrics.height).toBeCloseTo(0.5, 1);
    expect(metrics.right).toBeCloseTo(-4, 1);
    expect(metrics.bottom).toBeCloseTo(Math.max(2, metrics.fontSize * 0.08), 1);
    expect(metrics.background).toBe("rgb(125, 211, 252)");
    expect(metrics.animation).toContain("cf-blue-line-show");
    expect(metrics.transformOriginX).toBeCloseTo(metrics.markerWidth, 1);
    expect(metrics.marginInlineEnd).toBeCloseTo(4, 1);
    expect(metrics.whiteSpace).toBe("nowrap");
    sizes.push({ width: metrics.width, height: metrics.height });
  }

  expect(sizes[1]?.width).toBeCloseTo(sizes[0]?.width ?? 0, 0);
  expect(sizes[2]?.width).toBeCloseTo(sizes[0]?.width ?? 0, 0);
  expect(sizes[1]?.height).toBeCloseTo(sizes[0]?.height ?? 0, 0);
  expect(sizes[2]?.height).toBeCloseTo(sizes[0]?.height ?? 0, 0);

  await page.goto("/components/terminal-code-block/");
  const extremeMetrics = await page.locator(".astro-hero .cf-blue-line").evaluate((element) => ({
    contentWidth: element.getBoundingClientRect().width,
    markerWidth: Number.parseFloat(getComputedStyle(element, "::before").width),
    rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(extremeMetrics.contentWidth).toBeGreaterThan(extremeMetrics.markerWidth);
  expect(extremeMetrics.markerWidth).toBeLessThanOrEqual(extremeMetrics.rootFontSize * 18 + 1);
});

test("BlueLine reserves its overhang and uses the dark semantic marker", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("cf-theme", "dark"));
  await page.goto("/");

  const geometry = await page.locator(".astro-brand").evaluate((brand) => {
    const line = brand.querySelector<HTMLElement>(".cf-blue-line");
    const trailingText = [...brand.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.includes("design system"),
    );
    if (!line || !trailingText) throw new Error("Expected brand line and trailing text");

    const marker = getComputedStyle(line, "::before");
    const lineBounds = line.getBoundingClientRect();
    const textRange = document.createRange();
    textRange.selectNodeContents(trailingText);
    const textBounds = textRange.getBoundingClientRect();

    return {
      markerBackground: marker.backgroundColor,
      markerBottom: Number.parseFloat(marker.bottom),
      markerWidth: Number.parseFloat(marker.width),
      transformOriginX: Number.parseFloat(marker.transformOrigin),
      markerRight: lineBounds.right - Number.parseFloat(marker.right),
      trailingTextLeft: textBounds.left,
    };
  });

  expect(geometry.markerBackground).toBe("rgb(3, 105, 161)");
  expect(geometry.markerBottom).toBeCloseTo(2, 1);
  expect(geometry.transformOriginX).toBeCloseTo(geometry.markerWidth / 2, 1);
  expect(geometry.trailingTextLeft).toBeGreaterThanOrEqual(geometry.markerRight);

  const largeMarkerBottom = await page
    .locator("#principles-heading .cf-blue-line")
    .evaluate((line) => Number.parseFloat(getComputedStyle(line, "::before").bottom));
  expect(largeMarkerBottom).toBeGreaterThan(2);
});

test("Tooltip waits one second on hover, toggles on click, stays tethered, and never shifts its trigger", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Hover geometry is a desktop interaction.");
  test.setTimeout(30_000);

  for (const framework of frameworkNames) {
    await page.goto("/components/tooltip/");
    const panel = await selectFramework(page, framework);
    const trigger = panel.getByRole("button", { name: "More information", exact: true });
    const tooltip = panel.getByRole("tooltip");
    const before = await trigger.boundingBox();
    await expect(tooltip).toBeHidden();
    await trigger.hover();
    await page.waitForTimeout(850);
    await expect(tooltip).toBeHidden();
    await expect(tooltip).toBeVisible({ timeout: 500 });

    const triggerBounds = await trigger.boundingBox();
    const tooltipBounds = await tooltip.boundingBox();
    expect(triggerBounds).toEqual(before);
    expect(tooltipBounds).not.toBeNull();
    expect(triggerBounds).not.toBeNull();
    if (triggerBounds && tooltipBounds) {
      const gap = triggerBounds.y - (tooltipBounds.y + tooltipBounds.height);
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(16);
    }

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
    await trigger.click();
    await expect(tooltip).toBeVisible();
    await trigger.click();
    await expect(tooltip).toBeHidden();
    expect(await trigger.boundingBox()).toEqual(before);
  }
});

test("Dialog examples render the same platform surface and entrance motion", async ({ page }) => {
  const states: Array<{ text: string; width: number; height: number }> = [];

  for (const framework of frameworkNames) {
    await page.goto("/components/dialog/");
    const panel = await selectFramework(page, framework);
    const trigger = panel.getByRole("button", { name: "Open dialog", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close dialog", exact: true })).toBeVisible();
    const state = await dialog.evaluate((element) => {
      return {
        text: (element as HTMLElement).innerText.replaceAll(/\s+/g, " ").trim(),
        width: element.clientWidth,
        height: element.clientHeight,
        animation: getComputedStyle(element).animationName,
      };
    });
    expect(state.animation).toContain("cf-dialog-enter");
    states.push(state);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }

  expect(states[1]).toEqual(states[0]);
  expect(states[2]).toEqual(states[0]);
});

test("Accordion switches equal-height examples without moving following page content", async ({ page }) => {
  for (const framework of frameworkNames) {
    await page.goto("/components/accordion/");
    const panel = await selectFramework(page, framework);
    const usage = page.getByRole("heading", { name: "Usage", exact: true });
    const before = await usage.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    const toggle = panel.locator("summary", { hasText: "Which frameworks?" });
    await toggle.click();
    await page.waitForTimeout(400);
    const after = await usage.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    expect(after).toBeCloseTo(before, 0);
  }
});

test("ResponsiveImage swaps to the dark artwork for an explicit dark theme", async ({ page }) => {
  await page.goto("/components/responsive-image/");
  for (const framework of frameworkNames) {
    const panel = await selectFramework(page, framework);
    const light = panel.locator(".cf-responsive-image__light");
    const dark = panel.locator(".cf-responsive-image__dark");
    await expect(light).toBeVisible();
    await expect(dark).toBeHidden();
    await page.locator("html").evaluate((root) => {
      root.dataset.theme = "dark";
      root.dataset.themePreference = "dark";
    });
    await expect(light).toBeHidden();
    await expect(dark).toBeVisible();
    await page.locator("html").evaluate((root) => {
      root.dataset.theme = "light";
      root.dataset.themePreference = "light";
    });
  }
});

test("ToastProvider and ToastViewport create one matching bottom-right notification that expires", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Viewport placement is covered once at desktop size.",
  );
  test.setTimeout(45_000);
  const borders: string[] = [];

  for (const slug of ["toast-provider", "toast-viewport"] as const) {
    for (const framework of frameworkNames) {
      await page.goto(`/components/${slug}/`);
      const panel = await selectFramework(page, framework);
      await panel.getByRole("button", { name: "Show toast", exact: true }).click();
      const toast = page.locator(".cf-toast", { hasText: "Saved" });
      await expect(toast).toHaveCount(1);
      await expect(toast).toContainText("Your preferences are up to date.");
      await page.waitForTimeout(350);
      const state = await toast.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          right: window.innerWidth - bounds.right,
          bottom: window.innerHeight - bounds.bottom,
          border: style.borderColor,
          animation: style.animationName,
        };
      });
      expect(state.right).toBeGreaterThanOrEqual(0);
      expect(state.right).toBeLessThanOrEqual(32);
      expect(state.bottom).toBeGreaterThanOrEqual(0);
      expect(state.bottom).toBeLessThanOrEqual(32);
      expect(state.animation).toContain("cf-toast-enter");
      borders.push(state.border);
      await expect(toast).toHaveCount(0, { timeout: 6000 });
    }
  }

  expect(new Set(borders).size).toBe(1);
});

test("theme choice persists and updates the resolved theme", async ({ page }) => {
  await page.goto("/");
  const toggle = await visibleShowroomThemeToggle(page);
  await expect(toggle).toHaveAttribute("data-preference", "system");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "light");
  await expect(toggle).toHaveAttribute("data-preference", "light");
});

test("hydrated component previews never overwrite the saved page theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("cf-theme", "dark"));
  await page.goto("/components/");

  const themeIslands = page.locator("#theme-provider astro-island, #theme-toggle astro-island");
  await expect(themeIslands).toHaveCount(4);
  await expect
    .poll(() => themeIslands.evaluateAll((islands) => islands.every((island) => !island.hasAttribute("ssr"))))
    .toBe(true);

  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("cf-theme"))).toBe("dark");
});

test("system theme follows live prefers-color-scheme changes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("cf-theme", "system"));
  await page.goto("/");

  const root = page.locator("html");
  const toggle = page.locator("[data-showroom-theme]");
  await expect(root).toHaveAttribute("data-theme-preference", "system");
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAttribute("data-preference", "system");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(root).toHaveCSS("color-scheme", "dark");
  await expect(toggle).toHaveAttribute("data-preference", "system");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(root).toHaveAttribute("data-theme", "light");
});

test("ThemeScript resolves system preference before hydration", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("cf-theme", "system"));

  let blockedScriptRequests = 0;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      blockedScriptRequests += 1;
      await route.abort();
      return;
    }
    await route.continue();
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  if (!response) throw new Error("The showroom document did not return an HTTP response.");
  const html = await response.text();
  const themeCodeIndex = html.indexOf("localStorage.getItem");
  const themeScriptIndex = html.lastIndexOf("<script", themeCodeIndex);
  const headCloseIndex = html.toLowerCase().indexOf("</head>");

  expect(themeCodeIndex).toBeGreaterThan(themeScriptIndex);
  expect(themeScriptIndex).toBeGreaterThan(-1);
  expect(themeScriptIndex).toBeLessThan(headCloseIndex);
  expect(blockedScriptRequests).toBeGreaterThan(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(9, 9, 11)");
  await expect(page.locator("[data-showroom-theme]")).toHaveAttribute("data-preference", "system");
});

test("saved explicit theme label is correct before external scripts run", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("cf-theme", "dark"));
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") await route.abort();
    else await route.continue();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const visibleLabel = await page
    .locator("[data-cf-theme-label]")
    .first()
    .evaluate((element) => getComputedStyle(element, "::before").content.replaceAll('"', ""));
  expect(visibleLabel).toBe("Dark");
});

test("theme toggle active feedback never changes document geometry", async ({ page }) => {
  await page.goto("/");
  const toggle = await visibleShowroomThemeToggle(page);
  const before = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  const box = await toggle.boundingBox();
  if (!box) throw new Error("Theme toggle has no layout box.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const active = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  await page.mouse.up();
  expect(active).toEqual(before);
  expect(active.width).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test("native Checkbox and Switch use the visual control contract and toggle natively", async ({ page }) => {
  await page.goto("/components/checkbox/");
  let panel = page.locator('[data-framework-panel="native"]');
  const checkbox = panel.locator('.cf-checkbox input[type="checkbox"]').first();
  const checkboxControl = panel.locator(".cf-checkbox__control").first();
  await expect(checkbox).toBeChecked();
  await expect(checkboxControl).toBeVisible();
  await panel.locator(".cf-checkbox").first().click();
  await expect(checkbox).not.toBeChecked();

  await page.goto("/components/switch/");
  panel = page.locator('[data-framework-panel="native"]');
  const switchInput = panel.locator('.cf-switch input[role="switch"]').first();
  const switchTrack = panel.locator(".cf-switch__track").first();
  await expect(switchInput).toBeChecked();
  await expect(switchTrack).toBeVisible();
  await panel.locator(".cf-switch").first().click();
  await expect(switchInput).not.toBeChecked();
});

test.describe("CSS-only theme fallback", () => {
  test.use({ javaScriptEnabled: false });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`prefers-color-scheme provides the ${colorScheme} theme without JavaScript`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/");

      expect(await page.locator("html").getAttribute("data-theme")).toBeNull();
      expect(await page.locator("html").getAttribute("data-theme-preference")).toBeNull();
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        colorScheme === "dark" ? "rgb(9, 9, 11)" : "rgb(255, 255, 255)",
      );
    });
  }
});

test("native dialog controller opens and closes the platform dialog", async ({ page }) => {
  await page.goto("/components/dialog/");
  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).not.toBeVisible();
});

test("native menu supports roving focus, typeahead, Escape, and focus return", async ({ page }) => {
  await page.goto("/components/dropdown-menu/");
  const trigger = page.getByRole("button", { name: "Actions" });
  await trigger.focus();
  await trigger.press("ArrowDown");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
  await page.keyboard.press("d");
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("native tabs and accordion expose complete keyboard flows", async ({ page }) => {
  await page.goto("/components/tabs/");
  const nativePanel = page.locator('[data-framework-panel="native"]');
  const reactTab = nativePanel.getByRole("tab", { name: "React" });
  await reactTab.focus();
  await reactTab.press("ArrowRight");
  await expect(nativePanel.getByRole("tab", { name: "Svelte" })).toHaveAttribute("aria-selected", "true");
  await expect(nativePanel.getByRole("tabpanel", { name: "Svelte" })).toBeVisible();

  await page.goto("/components/accordion/");
  const accordionNativePanel = page.locator('[data-framework-panel="native"]');
  const first = accordionNativePanel.locator("summary", { hasText: "What is shared?" });
  const second = accordionNativePanel.locator("summary", { hasText: "Which frameworks?" });
  await first.focus();
  await first.press("End");
  await expect(second).toBeFocused();
  await second.press("Enter");
  await expect(second.locator("..")).toHaveAttribute("open", "");
  await expect(first.locator("..")).not.toHaveAttribute("open", "");
});

test("native tooltip and toast remain keyboard operable", async ({ page }) => {
  await page.goto("/components/tooltip/");
  const tooltipPanel = await selectFramework(page, "Native");
  const trigger = tooltipPanel.getByRole("button", { name: "More information", exact: true });
  await trigger.focus();
  await expect(tooltipPanel.getByRole("tooltip")).toBeVisible({ timeout: 1_000 });
  await trigger.press("Escape");
  await expect(tooltipPanel.getByRole("tooltip")).not.toBeVisible();

  await page.goto("/components/toast-provider/");
  const toastPanel = await selectFramework(page, "Native");
  await toastPanel.getByRole("button", { name: "Show toast", exact: true }).click();
  const toast = page.getByRole("status");
  await expect(toast).toContainText("Saved");
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  await expect(toast).not.toBeVisible();
});

test("reduced motion and forced colors preserve usable feedback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto("/components/button/");
  const button = page.getByRole("button", { name: "Primary" });
  await button.focus();
  const presentation = await button.evaluate((element) => {
    const styles = getComputedStyle(element);
    const duration = styles.transitionDuration.endsWith("ms")
      ? Number.parseFloat(styles.transitionDuration)
      : Number.parseFloat(styles.transitionDuration) * 1000;
    return {
      duration,
      outlineStyle: styles.outlineStyle,
      outlineWidth: Number.parseFloat(styles.outlineWidth),
    };
  });
  expect(presentation.duration).toBeLessThanOrEqual(0.01);
  expect(presentation.outlineStyle).not.toBe("none");
  expect(presentation.outlineWidth).toBeGreaterThanOrEqual(3);
});

for (const framework of frameworkNames) {
  test(`${framework} adapter passes the core interactive keyboard flows`, async ({ page }) => {
    await page.goto("/components/dialog/");
    let panel = await selectFramework(page, framework);
    await panel.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.goto("/components/dropdown-menu/");
    panel = await selectFramework(page, framework);
    const menuTrigger = panel.locator("button").first();
    await menuTrigger.focus();
    await menuTrigger.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("End");
    await expect(
      panel.locator('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])').last(),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menuTrigger).toBeFocused();

    await page.goto("/components/tabs/");
    panel = await selectFramework(page, framework);
    const tabs = panel.getByRole("tab");
    await tabs.first().focus();
    await tabs.first().press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");

    await page.goto("/components/accordion/");
    panel = await selectFramework(page, framework);
    const summaries = panel.locator("summary");
    await summaries.first().focus();
    await summaries.first().press("End");
    await expect(summaries.last()).toBeFocused();

    await page.goto("/components/tooltip/");
    panel = await selectFramework(page, framework);
    const tooltipTrigger = panel.locator("button").first();
    await tooltipTrigger.focus();
    await expect(page.getByRole("tooltip")).toBeVisible({ timeout: 1_000 });
    await tooltipTrigger.press("Escape");
    await expect(page.getByRole("tooltip")).not.toBeVisible();

    await page.goto("/components/toast-provider/");
    panel = await selectFramework(page, framework);
    await panel.locator("button").first().click();
    await expect(page.getByRole("status").or(page.getByRole("alert"))).toBeVisible();
  });
}

for (const route of accessibilityRoutes) {
  for (const theme of ["light", "dark"] as const) {
    test(`@a11y ${route} has no axe violations in ${theme}`, async ({ page }) => {
      await page.addInitScript((selectedTheme) => localStorage.setItem("cf-theme", selectedTheme), theme);
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expectNoAxeViolations(`${route} in ${theme}`, results.violations);
    });
  }
}

test("@a11y every component detail includes violation-free Native, React, and Svelte panels", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "DOM semantics only need one browser viewport.");
  test.setTimeout(300_000);
  expect(componentRoutes.length).toBeGreaterThan(0);

  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("cf-theme", "system"));
  const failures: Array<{ route: string; framework: string; violations: unknown[] }> = [];

  for (const route of componentRoutes) {
    await page.goto(route);
    for (const framework of frameworkNames) {
      await selectFramework(page, framework);
      const results = await new AxeBuilder({ page }).analyze();
      if (results.violations.length > 0) failures.push({ route, framework, violations: results.violations });
    }
  }

  expectNoAxeViolations("Component detail accessibility failures", failures);
});

test("@visual component overview remains stable in explicit and system themes", async ({ page }) => {
  await page.goto("/components/");
  await page.evaluate(() => localStorage.setItem("cf-theme", "light"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "light");
  await expect(page).toHaveScreenshot("components-light.png", { fullPage: true });
  await page.evaluate(() => localStorage.setItem("cf-theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
  await expect(page).toHaveScreenshot("components-dark.png", { fullPage: true });

  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => localStorage.setItem("cf-theme", "system"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page).toHaveScreenshot("components-system-dark.png", { fullPage: true });
});

test("@visual React and Svelte representative states remain stable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("cf-theme", "system"));

  for (const framework of ["React", "Svelte"] as const) {
    const adapter = framework.toLowerCase();

    await page.goto("/components/button/");
    let panel = await selectFramework(page, framework);
    await expect(panel).toHaveScreenshot(`${adapter}-button-states.png`);

    await page.goto("/components/text-field/");
    panel = await selectFramework(page, framework);
    await expect(panel).toHaveScreenshot(`${adapter}-text-field-error-states.png`);

    await page.goto("/components/dialog/");
    panel = await selectFramework(page, framework);
    await panel.getByRole("button", { name: "Open dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveScreenshot(`${adapter}-dialog-open.png`);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  }
});

test("@visual every React and Svelte component remains stable in both themes", async ({ page }) => {
  test.setTimeout(180_000);

  for (const framework of ["React", "Svelte"] as const) {
    const adapter = framework.toLowerCase();
    await page.goto("/components/");
    await page.evaluate(() => localStorage.setItem("cf-theme", "light"));
    await page.reload();
    await selectEveryOverviewFramework(page, framework);
    await expect(page).toHaveScreenshot(`components-${adapter}-light.png`, { fullPage: true });

    await page.evaluate(() => {
      localStorage.setItem("cf-theme", "dark");
      document.documentElement.dataset.theme = "dark";
      document.documentElement.dataset.themePreference = "dark";
      document.documentElement.style.colorScheme = "dark";
    });
    await expect(page).toHaveScreenshot(`components-${adapter}-dark.png`, { fullPage: true });
  }
});
