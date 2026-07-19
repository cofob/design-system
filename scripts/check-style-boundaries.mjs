import { parse as parseAstro } from "@astrojs/compiler";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse as parseSvelte } from "svelte/compiler";
import ts from "typescript";

const root = process.cwd();
const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".astro",
  ".svelte-kit",
  "coverage",
  "playwright-report",
  "test-results",
]);
const cssExtensions = new Set([".css", ".pcss", ".postcss"]);
const markupExtensions = new Set([".astro", ".html", ".jsx", ".svelte", ".tsx"]);
const violations = [];

const disallowedFramework = ["tail", "wind"].join("");
const disallowedDependencyPattern = new RegExp(`(?:^|[-/])${disallowedFramework}(?:css)?(?:$|-)`);
const disallowedDirectivePattern = new RegExp(
  `(^|[;{}]\\s*)@(${disallowedFramework}|apply|reference|theme|source|utility|variant|custom-variant|plugin|config)\\b`,
  "gm",
);
const disallowedImportPattern = new RegExp(
  `(^|[;{}]\\s*)@import\\s+(?:url\\(\\s*)?["'](?:${disallowedFramework}css|@${disallowedFramework}css\\/)`,
  "gm",
);

const exactUtilities = new Set([
  "absolute",
  "antialiased",
  "block",
  "border",
  "box-border",
  "box-content",
  "break-all",
  "break-keep",
  "break-normal",
  "break-words",
  "capitalize",
  "collapse",
  "contents",
  "fixed",
  "flex",
  "flow-root",
  "grid",
  "hidden",
  "inline",
  "inline-block",
  "inline-flex",
  "inline-grid",
  "italic",
  "lowercase",
  "no-underline",
  "not-italic",
  "not-sr-only",
  "relative",
  "sr-only",
  "static",
  "sticky",
  "subpixel-antialiased",
  "table",
  "table-cell",
  "table-row",
  "truncate",
  "underline",
  "uppercase",
  "visible",
  "whitespace-nowrap",
]);

const utilityPatterns = [
  /^-?(?:m[trblxy]?|p[trblxy]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|translate-[xy])-(?:px|auto|full|screen|\d+(?:\.5)?|\[[^\]]+\])$/,
  /^(?:size|w|h|min-w|max-w|min-h|max-h|basis)-(?:px|auto|full|screen(?:-(?:sm|md|lg|xl|2xl))?|svw|lvw|dvw|svh|lvh|dvh|min|max|fit|prose|\d+(?:\.5)?|\[[^\]]+\])$/,
  /^(?:grid-cols|grid-rows|col-span|row-span|col-start|col-end|row-start|row-end)-(?:none|subgrid|full|auto|\d+|\[[^\]]+\])$/,
  /^(?:flex)-(?:row|row-reverse|col|col-reverse|wrap|wrap-reverse|nowrap|1|auto|initial|none|\[[^\]]+\])$/,
  /^(?:grow|shrink)(?:-0)?$/,
  /^(?:justify|items|content|self|place-content|place-items|place-self)-(?:normal|start|end|center|between|around|evenly|stretch|baseline|auto)$/,
  /^(?:overflow|overscroll)(?:-[xy])?-(?:auto|hidden|clip|visible|scroll|contain|none)$/,
  /^(?:object)-(?:contain|cover|fill|none|scale-down|bottom|center|left|left-bottom|left-top|right|right-bottom|right-top|top)$/,
  /^(?:text)-(?:xs|sm|base|lg|xl|[2-9]xl|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty)$/,
  /^(?:font)-(?:sans|serif|mono|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  /^(?:leading|tracking|line-clamp)-(?:none|tight|snug|normal|relaxed|loose|tighter|wide|wider|widest|\d+|\[[^\]]+\])$/,
  /^(?:bg|text|border|outline|ring|divide|decoration|from|via|to|fill|stroke)-(?:inherit|current|transparent|black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d+)?$/,
  /^(?:rounded)(?:-(?:none|xs|sm|md|lg|xl|[2-9]xl|full|[trbl]|[trbl][trbl]|\[[^\]]+\]))?$/,
  /^(?:border)(?:-[xytrbl])?-(?:0|2|4|8|\[[^\]]+\])$/,
  /^(?:shadow)(?:-(?:2xs|xs|sm|md|lg|xl|2xl|inner|none|\[[^\]]+\]))?$/,
  /^(?:opacity|z|order|columns)-(?:\d+|auto|first|last|none|\[[^\]]+\])$/,
  /^(?:ring|outline)-(?:0|1|2|4|8|inset|none|hidden|\[[^\]]+\])$/,
  /^(?:transition)(?:-(?:none|all|colors|opacity|shadow|transform))?$/,
  /^(?:duration|delay)-(?:0|75|100|150|200|300|500|700|1000|\[[^\]]+\])$/,
  /^(?:ease)-(?:linear|in|out|in-out|\[[^\]]+\])$/,
  /^(?:animate)-(?:none|spin|ping|pulse|bounce|\[[^\]]+\])$/,
  /^(?:cursor)-(?:auto|default|pointer|wait|text|move|help|not-allowed|none|context-menu|progress|cell|crosshair|vertical-text|alias|copy|no-drop|grab|grabbing|all-scroll|col-resize|row-resize|zoom-in|zoom-out)$/,
  /^(?:select)-(?:none|text|all|auto)$/,
  /^(?:pointer-events)-(?:none|auto)$/,
];

const variantPattern =
  /^(?:(?:sm|md|lg|xl|2xl|dark|print|portrait|landscape|motion-safe|motion-reduce|contrast-more|contrast-less|hover|focus|focus-within|focus-visible|active|visited|target|disabled|enabled|checked|indeterminate|required|valid|invalid|open|first|last|only|odd|even|first-of-type|last-of-type|empty|group-[\w-]+|peer-[\w-]+|has-\[[^\]]+|aria-[\w-]+|data-\[[^\]]+|supports-\[[^\]]+):)+/;

function lineAt(source, offset) {
  return source.slice(0, Math.max(0, offset)).split("\n").length;
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

function scanCss(source, file, baseOffset = 0, lineSource = source) {
  const css = stripCssComments(source);
  for (const pattern of [disallowedDirectivePattern, disallowedImportPattern]) {
    pattern.lastIndex = 0;
    for (const match of css.matchAll(pattern)) {
      const directiveOffset = match.index + match[1].length;
      violations.push(
        `${file}:${lineAt(lineSource, directiveOffset + baseOffset)}: disallowed CSS directive`,
      );
    }
  }
}

function isGeneratedUtility(token) {
  const candidate = token.trim();
  if (!candidate || candidate.startsWith("cf-") || candidate.startsWith("astro-")) return false;

  const variantMatch = candidate.match(variantPattern);
  const utility = variantMatch ? candidate.slice(variantMatch[0].length) : candidate;
  if (!utility || utility.startsWith("cf-") || utility.startsWith("astro-")) return false;

  return exactUtilities.has(utility) || utilityPatterns.some((pattern) => pattern.test(utility));
}

function reportClassValue(value, file, line) {
  const utilities = [...new Set(value.split(/\s+/).filter(isGeneratedUtility))];
  for (const utility of utilities) {
    violations.push(`${file}:${line}: generated utility in class attribute: ${utility}`);
  }
}

function collectEstreeStrings(node, values) {
  if (!node || typeof node !== "object") return;
  if (node.type === "Literal" && typeof node.value === "string") values.push(node.value);
  if (node.type === "TemplateElement") values.push(node.value?.cooked ?? node.value?.raw ?? "");

  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "parent") continue;
    if (Array.isArray(value)) {
      for (const child of value) collectEstreeStrings(child, values);
    } else if (value && typeof value === "object") {
      collectEstreeStrings(value, values);
    }
  }
}

function collectTypeScriptStrings(node, values) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) values.push(node.text);
  if (ts.isTemplateExpression(node)) {
    values.push(node.head.text);
    for (const span of node.templateSpans) values.push(span.literal.text);
  }
  ts.forEachChild(node, (child) => collectTypeScriptStrings(child, values));
}

function stringsFromExpression(expression) {
  const sourceFile = ts.createSourceFile(
    "class-expression.tsx",
    `const __className = (${expression});`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const values = [];
  collectTypeScriptStrings(sourceFile, values);
  return values;
}

function scanTsx(source, file) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if ((name === "class" || name === "className") && node.initializer) {
        const values = [];
        if (ts.isStringLiteral(node.initializer)) values.push(node.initializer.text);
        else if (ts.isJsxExpression(node.initializer) && node.initializer.expression)
          collectTypeScriptStrings(node.initializer.expression, values);
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        for (const value of values) reportClassValue(value, file, line);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

function scanSvelte(source, file) {
  const ast = parseSvelte(source, { filename: file });
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.attributes)) {
      for (const attribute of node.attributes) {
        if (attribute.type !== "Attribute" || !["class", "className"].includes(attribute.name)) continue;
        const values = [];
        for (const part of attribute.value ?? []) {
          if (part.type === "Text") values.push(part.data ?? part.raw ?? "");
          else if (part.type === "MustacheTag") collectEstreeStrings(part.expression, values);
        }
        const line = lineAt(source, attribute.start ?? node.start ?? 0);
        for (const value of values) reportClassValue(value, file, line);
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (["attributes", "expression", "instance", "module", "css", "loc", "parent"].includes(key)) continue;
      if (Array.isArray(value)) {
        for (const child of value) visit(child);
      } else if (value && typeof value === "object") visit(value);
    }
  }
  visit(ast.html);

  if (ast.css?.content) {
    const start = ast.css.content.start ?? ast.css.start ?? 0;
    const end = ast.css.content.end ?? ast.css.end ?? source.length;
    scanCss(source.slice(start, end), file, start, source);
  }
}

async function scanAstro(source, file) {
  const { ast, diagnostics } = await parseAstro(source, { position: true });
  if (diagnostics?.some((diagnostic) => diagnostic.severity === 1)) {
    throw new Error(`Unable to parse ${file} while checking generated utility classes`);
  }

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.attributes)) {
      for (const attribute of node.attributes) {
        if (!["class", "className"].includes(attribute.name)) continue;
        const values =
          attribute.kind === "expression" ? stringsFromExpression(attribute.value) : [attribute.value];
        const line = attribute.position?.start?.line ?? node.position?.start?.line ?? 1;
        for (const value of values) reportClassValue(value, file, line);
      }
    }
    if (node.type === "element" && node.name === "style") {
      for (const child of node.children ?? []) {
        if (typeof child.value === "string") {
          scanCss(child.value, file, child.position?.start?.offset ?? 0, source);
        }
      }
    }
    for (const child of node.children ?? []) visit(child);
  }
  visit(ast);
}

async function scanMarkup(source, file, extension) {
  if (extension === ".svelte") scanSvelte(source, file);
  else if (extension === ".astro" || extension === ".html") await scanAstro(source, file);
  else scanTsx(source, file);
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }

    if (entry.name === "package.json") {
      const manifest = JSON.parse(await readFile(file, "utf8"));
      for (const group of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
        for (const name of Object.keys(manifest[group] ?? {})) {
          if (disallowedDependencyPattern.test(name)) {
            violations.push(`${file}: disallowed styling dependency in ${group}: ${name}`);
          }
        }
      }
    }

    const extension = path.extname(entry.name);
    if (cssExtensions.has(extension)) {
      scanCss(await readFile(file, "utf8"), file);
    } else if (markupExtensions.has(extension)) {
      await scanMarkup(await readFile(file, "utf8"), file, extension);
    }
  }
}

await walk(root);
if (violations.length > 0) {
  console.error(`Disallowed generated styling found:\n${violations.join("\n")}`);
  process.exit(1);
}
console.log("No disallowed styling dependencies, directives, or generated utility classes found.");
