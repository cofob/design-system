import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import postcssConfig from "../postcss.config.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(packageRoot, "src", "styles");
const outputRoot = path.join(packageRoot, "dist");
const entries = ["tokens.css", "fonts.css", "base.css", "components.css", "index.css"];
const config = postcssConfig({ env: "production" });

await mkdir(outputRoot, { recursive: true });

for (const entry of entries) {
  const from = path.join(sourceRoot, entry);
  const to = path.join(outputRoot, entry);
  const css = await readFile(from, "utf8");
  const result = await postcss(config.plugins).process(css, { from, map: false, to });
  await writeFile(to, result.css);
}

const authoringEntries = ["tokens.css", "fonts.css", "base.css", "components.css"];
const authoringCss = (
  await Promise.all(authoringEntries.map((entry) => readFile(path.join(sourceRoot, entry), "utf8")))
).join("\n");
await writeFile(path.join(outputRoot, "postcss.css"), authoringCss);

const fontSource = path.join(packageRoot, "src", "styles", "fonts", "Manrope.woff2");
const encodedFontSource = `${fontSource}.base64`;
const expectedFontSha256 = "b079b975d509b2bac8c43ba6fac399095b9d9eb9bc7761486b5ea675da7b7fd1";
const fontOutput = path.join(outputRoot, "fonts", "Manrope.woff2");
await mkdir(path.dirname(fontOutput), { recursive: true });
try {
  await access(fontSource, constants.R_OK);
  await copyFile(fontSource, fontOutput);
} catch {
  try {
    const encoded = (await readFile(encodedFontSource, "utf8")).replaceAll(/\s+/g, "");
    const font = Buffer.from(encoded, "base64");
    const digest = createHash("sha256").update(font).digest("hex");
    if (digest !== expectedFontSha256) {
      throw new Error(`unexpected SHA-256 ${digest}`);
    }
    await writeFile(fontOutput, font);
  } catch (error) {
    throw new Error(
      "Missing or invalid Manrope source. Add src/styles/fonts/Manrope.woff2 or its canonical base64 form.",
      { cause: error },
    );
  }
}
