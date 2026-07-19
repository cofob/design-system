import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const DEFAULT_DESCRIPTION = "A content-first design language and component system for cofob.dev sites.";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function readMeta(html, property) {
  const escapedProperty = property.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = html.match(
    new RegExp(`<meta\\s+[^>]*(?:property|name)=["']${escapedProperty}["'][^>]*>`, "i"),
  )?.[0];
  const content = tag?.match(/content=(["'])(.*?)\1/i)?.[2];
  return content ? decodeHtml(content) : undefined;
}

function wrapText(value, maxCharacters, maxLines) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines = [];

  for (const word of words) {
    const current = lines.at(-1);
    if (!current || `${current} ${word}`.length > maxCharacters) {
      if (lines.length === maxLines) {
        const lastLine = lines.at(-1) ?? "";
        lines[lines.length - 1] = `${lastLine.replace(/[.,;:!?]?$/, "")}…`;
        break;
      }
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }

  return lines;
}

function textLines(lines, x, y, lineHeight, className) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" class="${className}">${escapeXml(line)}</text>`,
    )
    .join("");
}

function pageLabel(imagePathname) {
  const segments = imagePathname.split("/").filter(Boolean);
  return segments[1] === "components" && segments.length > 2 ? "COMPONENT REFERENCE" : "DESIGN SYSTEM";
}

function fallbackTitle(imagePathname) {
  const slug =
    imagePathname
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/\.png$/, "") ?? "index";
  if (slug === "index") return "cofob Design System";
  if (slug === "api") return "API reference";
  return slug
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export async function renderSocialImage({ title, description, imagePathname }) {
  const displayTitle = title.replace(/ — cofob Design System$/, "");
  const titleLines = wrapText(displayTitle, 27, 2);
  const descriptionLines = wrapText(description, 69, 2);
  const descriptionY = titleLines.length > 1 ? 475 : 405;
  const label = pageLabel(imagePathname);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#38bdf8" />
          <stop offset="1" stop-color="#0ea5e9" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#e0f2fe" />
          <stop offset="1" stop-color="#f8fafc" stop-opacity="0" />
        </radialGradient>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#e4e4e7" stroke-width="1" />
        </pattern>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#0369a1" flood-opacity="0.22" />
        </filter>
        <style>
          text { font-family: Manrope, Inter, Arial, sans-serif; }
          .brand { fill: #18181b; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
          .label { fill: #0369a1; font-size: 18px; font-weight: 700; letter-spacing: 3px; }
          .title { fill: #18181b; font-size: 72px; font-weight: 750; letter-spacing: -2.6px; }
          .description { fill: #52525b; font-size: 26px; font-weight: 500; letter-spacing: -0.35px; }
          .domain { fill: #71717a; font-size: 20px; font-weight: 650; letter-spacing: 0.2px; }
        </style>
      </defs>
      <rect width="1200" height="630" fill="#fafafa" />
      <rect width="1200" height="630" fill="url(#grid)" opacity="0.48" />
      <circle cx="1040" cy="90" r="310" fill="url(#glow)" />
      <circle cx="1102" cy="-18" r="196" fill="url(#sky)" filter="url(#shadow)" />
      <circle cx="1102" cy="-18" r="138" fill="none" stroke="#ffffff" stroke-opacity="0.34" stroke-width="2" />
      <path d="M80 81 C126 66 168 92 214 76" fill="none" stroke="#38bdf8" stroke-width="16" stroke-linecap="round" opacity="0.62" />
      <text x="80" y="91" class="brand">cofob</text>
      <text x="162" y="91" class="brand" fill="#71717a">design system</text>
      <text x="80" y="202" class="label">${label}</text>
      ${textLines(titleLines, 76, 292, 82, "title")}
      ${textLines(descriptionLines, 80, descriptionY, 38, "description")}
      <line x1="80" y1="562" x2="1120" y2="562" stroke="#d4d4d8" stroke-width="2" />
      <circle cx="91" cy="594" r="5" fill="#0ea5e9" />
      <text x="110" y="601" class="domain">design.cofob.dev</text>
      <text x="1120" y="601" class="domain" text-anchor="end">Native · React · Svelte</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
}

async function renderBuildPage(page, dir) {
  const routePath = page.pathname === "/" ? "" : page.pathname.replace(/^\//, "").replace(/\/$/, "");
  const htmlUrl = new URL(`${routePath ? `${routePath}/` : ""}index.html`, dir);
  let html;
  try {
    html = await readFile(htmlUrl, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
  const title = readMeta(html, "og:title");
  const description = readMeta(html, "og:description");
  const image = readMeta(html, "og:image");

  if (!title || !description || !image) {
    throw new Error(`Missing Open Graph metadata in ${fileURLToPath(htmlUrl)}`);
  }

  const imageUrl = new URL(image);
  const outputUrl = new URL(imageUrl.pathname.replace(/^\//, ""), dir);
  await mkdir(new URL("./", outputUrl), { recursive: true });
  await writeFile(
    outputUrl,
    await renderSocialImage({ title, description, imagePathname: imageUrl.pathname }),
  );
  return true;
}

async function renderInBatches(pages, dir, batchSize = 4) {
  let generatedImages = 0;
  for (let index = 0; index < pages.length; index += batchSize) {
    const results = await Promise.all(
      pages.slice(index, index + batchSize).map((page) => renderBuildPage(page, dir)),
    );
    generatedImages += results.filter(Boolean).length;
  }
  return generatedImages;
}

export default function socialImages() {
  const developmentCache = new Map();

  return {
    name: "cofob-social-images",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(async (request, response, next) => {
          const requestUrl = new URL(request.url ?? "/", "http://localhost");
          if (!requestUrl.pathname.startsWith("/og/") || !requestUrl.pathname.endsWith(".png")) {
            next();
            return;
          }

          let image = developmentCache.get(requestUrl.pathname);
          if (!image) {
            image = await renderSocialImage({
              title: fallbackTitle(requestUrl.pathname),
              description: DEFAULT_DESCRIPTION,
              imagePathname: requestUrl.pathname,
            });
            developmentCache.set(requestUrl.pathname, image);
          }

          response.statusCode = 200;
          response.setHeader("Content-Type", "image/png");
          response.setHeader("Cache-Control", "public, max-age=3600");
          response.end(image);
        });
      },
      "astro:build:done": async ({ pages, dir, logger }) => {
        const generatedImages = await renderInBatches(pages, dir);
        logger.info(`Generated ${generatedImages} social preview images.`);
      },
    },
  };
}
