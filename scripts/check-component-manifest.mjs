import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("apps/showroom/src/data/components.json", "utf8"));
const names = manifest.flatMap((group) => group.components.map((component) => component.name));
const duplicate = names.find((name, index) => names.indexOf(name) !== index);
if (duplicate) throw new Error(`Duplicate showroom component: ${duplicate}`);

const expected = [
  "ThemeProvider",
  "ThemeScript",
  "ThemeToggle",
  "SkipLink",
  "AppShell",
  "Heading",
  "Text",
  "Link",
  "Prose",
  "Container",
  "Section",
  "Stack",
  "Inline",
  "Button",
  "IconButton",
  "Field",
  "TextField",
  "Textarea",
  "Select",
  "Checkbox",
  "Switch",
  "Captcha",
  "Badge",
  "Tag",
  "Alert",
  "Card",
  "EmptyState",
  "CodeBlock",
  "TerminalCodeBlock",
  "Table",
  "Pagination",
  "Dialog",
  "Popover",
  "DropdownMenu",
  "Tabs",
  "Accordion",
  "Tooltip",
  "ToastProvider",
  "ToastViewport",
  "BlueLine",
  "Navbar",
  "Footer",
  "PostCard",
  "LatestPostCard",
  "SearchResultCard",
  "ResponsiveImage",
  "Avatar",
  "InlineEmoji",
  "MediaGrid",
  "ChatThread",
  "Sticker",
  "AnimatedSticker",
];

for (const name of expected) {
  if (!names.includes(name)) throw new Error(`${name} is missing from the showroom manifest`);
}

const documentationSources = await Promise.all(
  [
    "apps/showroom/src/data/component-contracts.ts",
    "apps/showroom/src/components/NativePreview.astro",
    "apps/showroom/src/components/ReactComponentPreview.tsx",
    "apps/showroom/src/components/SvelteComponentPreview.svelte",
  ].map(async (sourcePath) => ({ sourcePath, source: await readFile(sourcePath, "utf8") })),
);

for (const { sourcePath, source } of documentationSources) {
  for (const name of expected) {
    if (!source.includes(name)) throw new Error(`${name} is missing from ${sourcePath}`);
  }
}

for (const sourcePaths of [
  [
    "packages/design-system-react/src/index.ts",
    "packages/design-system-react/src/static.tsx",
    "packages/design-system-react/src/client.tsx",
  ],
  ["packages/design-system-svelte/src/lib/index.ts"],
]) {
  const source = (await Promise.all(sourcePaths.map((sourcePath) => readFile(sourcePath, "utf8")))).join(
    "\n",
  );
  for (const name of expected) {
    if (!source.includes(name)) throw new Error(`${name} is not exported by ${sourcePaths[0]}`);
  }
}

console.log(`${names.length} public components are documented and exported by both adapters.`);
