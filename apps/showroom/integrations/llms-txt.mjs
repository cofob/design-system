import { mkdir, readFile, writeFile } from "node:fs/promises";
import TurndownService from "turndown";
import turndownPluginGfm from "turndown-plugin-gfm";

const { gfm } = turndownPluginGfm;

const SITE_URL = "https://design.cofob.dev";
const INDEX_PATH = "/llms.txt";
const FULL_PATH = "/llms-full.txt";
const MARKDOWN_DIRECTORY = "llms";
const SUMMARY =
  "A content-first design language and component system for cofob.dev sites, with one semantic CSS contract and native, React, and Svelte implementations.";
const PACKAGES = [
  "@cofob/design-system-css",
  "@cofob/design-system-react",
  "@cofob/design-system-svelte",
  "@cofob/design-system-asciinema-player",
  "@cofob/design-system-stickers",
  "@cofob/design-system-assets",
];
const GUIDE_ROUTES = [
  "/foundations/",
  "/components/",
  "/stickers/",
  "/api/",
  "/accessibility/",
  "/installation/",
  "/migration/",
];
const REMOVED_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "video",
  "img",
  "picture",
  "source",
  "[hidden]",
  "[data-cf-copy-button]",
  "[data-framework-panel]",
  "[data-cf-animated-sticker]",
  ".cf-visually-hidden",
  ".cf-sr-only",
  ".astro-framework-tabs",
  ".cf-code-block__toolbar",
  ".cf-terminal-code-block__toolbar",
  ".astro-sticker-card-media",
  ".astro-sticker-card-actions",
  ".astro-sticker-emoji",
  ".astro-sticker-pack-toolbar",
].join(",");
const BREADCRUMB = /^<p><a class="cf-link" href="[^"]+">←[^<]*<\/a><\/p>/;

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function plainText(value) {
  return decodeHtml(value.replaceAll(/<[^>]*>/g, " "))
    .replaceAll(/\s+/g, " ")
    .trim();
}

function firstElementText(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? plainText(match[1]) : "";
}

function firstClassText(html, className) {
  const match = html.match(
    new RegExp(`<([a-z][a-z0-9]*)[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)</\\1>`, "i"),
  );
  return match ? plainText(match[2]) : "";
}

function metaDescription(html) {
  const match = html.match(/<meta[^>]*\bname="description"[^>]*\bcontent="([^"]*)"/i);
  return match ? plainText(match[1]) : "";
}

function extractMain(html, route) {
  const start = html.indexOf("<main");
  const end = html.lastIndexOf("</main>");
  if (start < 0 || end < start) throw new Error(`No <main> element in ${route}`);
  return html.slice(html.indexOf(">", start) + 1, end);
}

function longestBacktickRun(value) {
  let longest = 0;
  for (const match of value.matchAll(/`+/g)) longest = Math.max(longest, match[0].length);
  return longest;
}

function createTurndown() {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    hr: "---",
    emDelimiter: "*",
  });
  service.use(gfm);
  service.addRule("removed", {
    filter: (node) =>
      (typeof node.matches === "function" && node.matches(REMOVED_SELECTORS)) ||
      (node.nodeName === "A" && (node.getAttribute("aria-label") ?? "").endsWith("API and examples")),
    replacement: () => "",
  });
  service.addRule("tableCell", {
    filter: ["th", "td"],
    replacement: (content, node) => {
      const value = content.replaceAll(/\s+/g, " ").replaceAll("|", "\\|").trim();
      const index = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
      return `${index === 0 ? "| " : " "}${value} |`;
    },
  });
  service.addRule("dataTable", {
    filter: (node) => {
      if (node.nodeName !== "TABLE") return false;
      const firstRow = node.rows[0];
      if (node.tHead || !firstRow) return false;
      return !Array.from(firstRow.cells).every((cell) => cell.nodeName === "TH");
    },
    replacement: (_content, node) => {
      const rows = Array.from(node.rows).map((row) => {
        const cells = Array.from(row.cells).map((cell) => {
          const value = Array.from(cell.childNodes)
            .map((child) =>
              child.nodeName === "CODE" ? `\`${child.textContent}\`` : (child.textContent ?? ""),
            )
            .join("")
            .replaceAll(/\s+/g, " ")
            .trim();
          return value;
        });
        const [key, ...rest] = cells;
        return rest.length ? `- **${key}**: ${rest.join(" ")}` : `- ${key}`;
      });
      return `\n\n${rows.join("\n")}\n\n`;
    },
  });
  service.addRule("badge", {
    filter: (node) => node.classList?.contains("cf-badge"),
    replacement: (content) => ` ${content.trim()} `,
  });
  service.addRule("block", {
    filter: (node) =>
      ["DIV", "SECTION", "ARTICLE", "HEADER", "ASIDE", "NAV", "FIGURE", "DETAILS", "SUMMARY"].includes(
        node.nodeName,
      ) &&
      !node.classList.contains("astro-sticker-card") &&
      !node.matches(REMOVED_SELECTORS),
    replacement: (content) => (content.trim() ? `\n\n${content.trim()}\n\n` : ""),
  });
  service.addRule("codeBlock", {
    filter: (node) => node.nodeName === "PRE",
    replacement: (_content, node) => {
      const code = (node.textContent ?? "").replace(/\n$/, "");
      const language =
        node.getAttribute("data-language") ??
        node.querySelector("[data-language]")?.getAttribute("data-language") ??
        "";
      const fence = "`".repeat(Math.max(3, longestBacktickRun(code) + 1));
      return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
    },
  });
  service.addRule("stickerCard", {
    filter: (node) => node.nodeName === "ARTICLE" && node.classList.contains("astro-sticker-card"),
    replacement: (_content, node) => {
      const name = node.querySelector("code")?.textContent?.trim() ?? "";
      const format = node.querySelector(".cf-badge")?.textContent?.trim() ?? "";
      return name ? `\n- \`${name}\`${format ? ` (${format})` : ""}` : "";
    },
  });
  service.addRule("link", {
    filter: (node) => node.nodeName === "A",
    replacement: (content, node) => {
      const href = node.getAttribute("href") ?? "";
      if (!content.trim()) return "";
      return `[${content.trim()}](${href.startsWith("/") ? `${SITE_URL}${href}` : href})`;
    },
  });
  return service;
}

function spaceInlineMarkdown(value) {
  let inFence = false;
  return value
    .split("\n")
    .map((line) => {
      if (line.startsWith("```")) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      let output = "";
      for (const part of line.split(/(`[^`\n]+`)/)) {
        if (part.startsWith("`") && part.endsWith("`")) {
          if (/[A-Za-z0-9`]$/.test(output)) output += " ";
          output += part;
        } else {
          if (output.endsWith("`") && (/^[A-Za-z0-9]/.test(part) || part.startsWith("`"))) output += " ";
          output += part.replaceAll(/[ \t]{2,}/g, " ");
        }
      }
      return output;
    })
    .join("\n");
}

function cleanupMarkdown(value) {
  let markdown = spaceInlineMarkdown(value)
    .replaceAll(/[ \t]+$/gm, "")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
  for (let pass = 0; pass < 3; pass += 1) {
    markdown = markdown.replace(/(^|\n)(#{2,6} [^\n]+)\n+(?=#{1,6} )/g, "$1");
  }
  return markdown.replaceAll(/\n{3,}/g, "\n\n").trim();
}

export function pageMarkdown(html, route) {
  const main = extractMain(html, route).replace(BREADCRUMB, "");
  const markdown = cleanupMarkdown(createTurndown().turndown(main));
  return `${markdown}\n\nSource: ${SITE_URL}${route}\n`;
}

function routeToFile(route) {
  return `${MARKDOWN_DIRECTORY}/${route === "/" ? "index" : route.slice(1, -1)}.md`;
}

function fileToRoute(pathname) {
  if (pathname === `/${MARKDOWN_DIRECTORY}/index.md`) return "/";
  return `${pathname.slice(MARKDOWN_DIRECTORY.length + 1, -".md".length)}/`;
}

function markdownUrl(route) {
  return `${SITE_URL}/${routeToFile(route)}`;
}

function parseComponents(html) {
  const categories = [];
  for (const chunk of html.split('<section class="astro-section"').slice(1)) {
    if (!chunk.includes("astro-component-card")) continue;
    const category = firstElementText(chunk, "h2");
    const components = [];
    for (const card of chunk.split('<article class="astro-component-card"').slice(1)) {
      const openTag = card.slice(0, card.indexOf(">"));
      const slug = openTag.match(/\bid="([^"]+)"/)?.[1];
      const name = firstElementText(card, "h3");
      const description = card.match(/<\/h3>\s*<p>([\s\S]*?)<\/p>/)?.[1] ?? "";
      if (slug && name) components.push({ slug, name, description: plainText(description) });
    }
    if (components.length) categories.push({ category, components });
  }
  return categories;
}

function parsePacks(html) {
  const packs = [];
  for (const card of html.split('<article class="cf-card astro-sticker-pack-card"').slice(1)) {
    const slug = card.match(/href="\/stickers\/([^/"]+)\//)?.[1];
    const title = firstElementText(card, "h3");
    const note = firstClassText(card, "astro-sticker-pack-kicker");
    if (slug && title) packs.push({ slug, title, note });
  }
  return packs;
}

export async function collectIndex(readPage) {
  const pages = new Map();
  const read = async (route) => {
    if (!pages.has(route)) pages.set(route, await readPage(route));
    return pages.get(route);
  };
  const guides = [];
  for (const route of ["/", ...GUIDE_ROUTES]) {
    const html = await read(route);
    const label =
      route === "/" ? "Overview" : firstClassText(html, "astro-eyebrow") || firstElementText(html, "h1");
    guides.push({ route, label, description: metaDescription(html) });
  }
  const categories = parseComponents(await read("/components/"));
  const packs = parsePacks(await read("/stickers/"));
  if (!categories.length) throw new Error("No components found on /components/.");
  if (!packs.length) throw new Error("No sticker packs found on /stickers/.");
  return { guides, categories, packs };
}

function allRoutes(index) {
  return [
    "/",
    ...index.guides.filter((guide) => guide.route !== "/").map((guide) => guide.route),
    ...index.categories.flatMap(({ components }) => components.map(({ slug }) => `/components/${slug}/`)),
    ...index.packs.map(({ slug }) => `/stickers/${slug}/`),
  ];
}

export function renderLlmsTxt(index) {
  const lines = [
    "# cofob Design System",
    "",
    `> ${SUMMARY}`,
    "",
    `Documentation: ${SITE_URL}. Published packages: ${PACKAGES.join(", ")}. Each link below is the Markdown version of a page.`,
    "",
    "## Guides",
    ...index.guides.map((guide) => `- [${guide.label}](${markdownUrl(guide.route)}): ${guide.description}`),
  ];
  for (const { category, components } of index.categories) {
    lines.push("", `## ${category}`);
    for (const { slug, name, description } of components) {
      lines.push(`- [${name}](${markdownUrl(`/components/${slug}/`)}): ${description}`);
    }
  }
  lines.push("", "## Sticker packs");
  for (const { slug, title, note } of index.packs) {
    lines.push(`- [${title}](${markdownUrl(`/stickers/${slug}/`)}): ${note}`);
  }
  lines.push("", "## Optional", `- [Full documentation](${SITE_URL}${FULL_PATH}): every page in one file.`);
  return `${lines.join("\n").replaceAll(/\n{3,}/g, "\n\n")}\n`;
}

async function renderFiles(readPage, index) {
  const files = new Map();
  const routes = allRoutes(index);
  for (const route of routes) files.set(routeToFile(route), pageMarkdown(await readPage(route), route));
  const full = routes.map((route) => files.get(routeToFile(route))).join("\n\n---\n\n");
  return { files, full };
}

function memoize(load) {
  const cache = new Map();
  return (key) => {
    if (!cache.has(key)) cache.set(key, Promise.resolve(load(key)));
    return cache.get(key);
  };
}

function isRequestPath(pathname) {
  return (
    pathname === INDEX_PATH || pathname === FULL_PATH || /^\/llms\/[a-z0-9][a-z0-9/_-]*\.md$/.test(pathname)
  );
}

async function renderRequest(pathname, readPage) {
  const index = await collectIndex(readPage);
  if (pathname === FULL_PATH) {
    const { full } = await renderFiles(readPage, index);
    return { body: full, contentType: "text/plain; charset=utf-8" };
  }
  if (pathname === INDEX_PATH) {
    return { body: renderLlmsTxt(index), contentType: "text/plain; charset=utf-8" };
  }
  const route = fileToRoute(pathname);
  if (!allRoutes(index).includes(route)) return null;
  return { body: pageMarkdown(await readPage(route), route), contentType: "text/markdown; charset=utf-8" };
}

export default function llmsTxt() {
  return {
    name: "cofob-llms-txt",
    hooks: {
      "astro:server:setup": ({ server }) => {
        const cache = new Map();
        server.middlewares.use(async (request, response, next) => {
          const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
          if (!isRequestPath(pathname)) {
            next();
            return;
          }
          try {
            if (!cache.has(pathname)) {
              const origin = server.resolvedUrls?.local?.[0] ?? `http://${request.headers.host}`;
              const readPage = memoize(async (route) => {
                const pageResponse = await fetch(new URL(route, origin), {
                  signal: AbortSignal.timeout(30_000),
                });
                if (!pageResponse.ok) throw new Error(`Failed to read ${route}: ${pageResponse.status}`);
                return pageResponse.text();
              });
              cache.set(pathname, await renderRequest(pathname, readPage));
            }
            const entry = cache.get(pathname);
            if (!entry) {
              next();
              return;
            }
            response.statusCode = 200;
            response.setHeader("Content-Type", entry.contentType);
            response.setHeader("Cache-Control", "no-store");
            response.end(entry.body);
          } catch (error) {
            console.error(`[llms-txt] ${error instanceof Error ? error.message : String(error)}`);
            response.statusCode = 500;
            response.setHeader("Content-Type", "text/plain; charset=utf-8");
            response.end(`${error instanceof Error ? error.message : String(error)}\n`);
          }
        });
      },
      "astro:build:done": async ({ dir, logger }) => {
        const readPage = memoize((route) =>
          readFile(new URL(route === "/" ? "index.html" : `${route.slice(1)}index.html`, dir), "utf8"),
        );
        const index = await collectIndex(readPage);
        const { files, full } = await renderFiles(readPage, index);
        await writeFile(new URL("llms.txt", dir), renderLlmsTxt(index));
        await writeFile(new URL("llms-full.txt", dir), full);
        for (const [file, body] of files) {
          const url = new URL(file, dir);
          await mkdir(new URL("./", url), { recursive: true });
          await writeFile(url, body);
        }
        logger.info(`Generated ${files.size} Markdown pages and llms.txt.`);
      },
    },
  };
}
