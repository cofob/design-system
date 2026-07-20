import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcss from "postcss";
import postcssImport from "postcss-import";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(packageRoot, "src", "styles.css");
const to = path.join(packageRoot, "dist", "styles.css");
const css = await readFile(from, "utf8");
const result = await postcss([postcssImport(), autoprefixer(), cssnano({ preset: "default" })]).process(css, {
  from,
  map: false,
  to,
});

await mkdir(path.dirname(to), { recursive: true });
await writeFile(to, result.css);
