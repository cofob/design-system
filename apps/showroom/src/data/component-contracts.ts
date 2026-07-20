export interface ComponentContract {
  selector: string;
  props: readonly string[];
  parameters: readonly ParameterDoc[];
  states: readonly string[];
  react: string;
  svelte: string;
  native: string;
}

export type Adapter = "React" | "Svelte" | "HTML";

export interface ParameterDoc {
  name: string;
  type: string;
  defaultValue: string;
  required: boolean;
  adapters: readonly Adapter[];
  description: string;
  example: string;
}

const kebab = (name: string) => name.replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const selectorOverrides: Record<string, string> = {
  ThemeProvider: "html[data-theme]",
  ThemeScript: "html[data-theme]",
  TextField: ".cf-input",
  DropdownMenu: ".cf-menu",
  ToastProvider: ".cf-toast-viewport",
};

const props: Record<string, readonly string[]> = {
  ThemeProvider: ["preference", "defaultPreference", "onPreferenceChange", "storageKey", "children"],
  ThemeScript: ["storageKey", "nonce"],
  ThemeToggle: ["preference", "cycle", "labels", "showLabel", "onPreferenceChange", "button attributes"],
  SkipLink: ["targetId/href", "children", "anchor attributes"],
  AppShell: ["children", "div attributes"],
  Heading: ["level/as", "size", "children"],
  Text: ["as", "size", "tone", "children"],
  Link: ["href", "external", "quiet/underline", "children", "anchor attributes"],
  Prose: ["size", "children", "article attributes"],
  Container: ["size", "children"],
  Section: ["spacing/surface", "eyebrow/title/description", "children", "section attributes"],
  Stack: ["gap", "align", "children"],
  Inline: ["gap", "align", "justify", "wrap", "children"],
  Button: [
    "variant",
    "size",
    "tone",
    "loading",
    "fullWidth",
    "leading/startIcon",
    "trailing/endIcon",
    "button attributes",
    "children",
  ],
  IconButton: ["label", "icon/children", "size", "variant", "tone", "loading", "button attributes"],
  Field: [
    "label",
    "htmlFor/forId",
    "hint/description",
    "error",
    "required",
    "hintId/errorId",
    "children",
    "div attributes",
  ],
  TextField: [
    "value/defaultValue",
    "label",
    "hint/description",
    "error",
    "size",
    "leading/trailing",
    "input attributes",
  ],
  Textarea: ["value/defaultValue", "label", "hint/description", "error", "size", "textarea attributes"],
  Select: [
    "value/defaultValue",
    "label",
    "hint/description",
    "options/children",
    "placeholder",
    "error",
    "size",
    "select attributes",
  ],
  Checkbox: [
    "checked/defaultChecked",
    "indeterminate",
    "label",
    "description",
    "size",
    "children",
    "input attributes",
  ],
  Switch: [
    "checked/defaultChecked",
    "label",
    "description",
    "size",
    "children",
    "onCheckedChange",
    "input attributes",
  ],
  Captcha: ["state", "labels", "button attributes"],
  Badge: ["tone", "size", "variant", "children"],
  Tag: ["tone", "size", "removable", "removeLabel", "onRemove", "children", "span attributes"],
  Alert: ["tone", "title", "icon", "dismissible", "dismissLabel", "onDismiss", "children", "div attributes"],
  Card: ["variant", "padding", "href", "as", "children", "surface attributes"],
  EmptyState: ["title", "description", "icon", "action", "children", "div attributes"],
  CodeBlock: [
    "code",
    "language",
    "showLanguage",
    "copyable",
    "copyLabel",
    "copiedLabel",
    "copyErrorLabel",
    "copyResetAfter",
    "div attributes",
  ],
  TerminalCodeBlock: [
    "entries",
    "label",
    "prompt",
    "copyable",
    "copyLabel",
    "copiedLabel",
    "copyErrorLabel",
    "copyResetAfter",
    "outputLabel",
    "div attributes",
  ],
  Table: [
    "label",
    "caption",
    "density",
    "headerTone",
    "striped",
    "minWidth",
    "containerClassName/containerClass",
    "children",
    "table attributes",
  ],
  Pagination: [
    "page/currentPage",
    "totalPages/items",
    "previousHref/nextHref",
    "getHref",
    "siblingCount",
    "onPageChange",
    "label",
    "nav attributes",
  ],
  Dialog: [
    "open/defaultOpen",
    "onOpenChange",
    "trigger",
    "triggerLabel",
    "title",
    "description",
    "footer",
    "closeLabel",
    "dialog attributes",
    "children",
  ],
  Popover: [
    "open/defaultOpen",
    "onOpenChange",
    "trigger",
    "triggerLabel/label",
    "placement",
    "children",
    "div attributes",
  ],
  DropdownMenu: [
    "items",
    "trigger",
    "triggerLabel/label",
    "open/defaultOpen",
    "onOpenChange",
    "onSelect",
    "size",
    "placement",
    "div attributes",
  ],
  Tabs: [
    "items/tabs",
    "value/defaultValue",
    "onValueChange",
    "orientation",
    "activation/activationMode",
    "label",
    "children",
    "div attributes",
  ],
  Accordion: ["items", "value/defaultValue", "onValueChange", "multiple", "children", "div attributes"],
  Tooltip: ["content", "trigger/children", "delay", "placement", "span attributes"],
  ToastProvider: ["limit/defaultDuration", "viewport/position", "children"],
  ToastViewport: ["label", "position", "closeLabel"],
  BlueLine: ["animate", "rainbow", "children"],
  Navbar: [
    "brand",
    "brandLabel",
    "homeHref/brandHref",
    "links",
    "actions",
    "brandContent",
    "menuLabel",
    "menuToggleLabel",
    "collapseAt",
    "menuVariant",
    "surface",
    "open/defaultOpen",
    "onOpenChange",
    "nav attributes",
  ],
  Footer: ["brand", "description", "groups", "links", "legal/copyright", "children", "footer attributes"],
  PostCard: ["post", "headingLevel", "anchor attributes"],
  LatestPostCard: ["post", "headingLevel", "eyebrow", "anchor attributes"],
  SearchResultCard: ["result", "query", "headingLevel", "anchor attributes"],
  ResponsiveImage: ["image", "darkImage", "caption", "aspectRatio", "fit", "priority", "image attributes"],
  Avatar: ["image", "name", "alt", "size", "loading", "referrerPolicy/referrerpolicy", "span attributes"],
  InlineEmoji: ["image", "alt", "referrerPolicy/referrerpolicy", "image attributes"],
  MediaGrid: ["as", "children", "container attributes"],
  ChatThread: ["messages", "label", "list attributes"],
  Sticker: ["tone", "rotation", "children", "data-image", "span attributes"],
  AnimatedSticker: ["sticker", "alt", "playback", "preload", "span attributes"],
  AnimatedStickerToggle: [
    "enabled/defaultEnabled",
    "label",
    "description",
    "size",
    "onEnabledChange",
    "input attributes",
  ],
};

const allAdapters = ["React", "Svelte", "HTML"] as const;

const parameterTypes: Record<string, string> = {
  preference: '"light" | "dark" | "system"',
  defaultPreference: '"light" | "dark" | "system"',
  onPreferenceChange: "(preference: ThemePreference) => void",
  storageKey: "string",
  nonce: "string",
  cycle: "readonly ThemePreference[]",
  labels: "Partial<Record<string, string>>",
  showLabel: "boolean",
  "targetId/href": "string",
  "level/as": '1–6 | "h1"–"h6" (Svelte/HTML)',
  as: "element name (adapter-specific union)",
  size: '"sm" | "md" | "lg" (plus heading sizes)',
  tone: '"neutral" | "accent" | "info" | "success" | "warning" | "danger"',
  href: "string",
  external: "boolean",
  "quiet/underline": 'boolean (React) | "always" | "hover" | "none" (Svelte)',
  "spacing/surface": 'Size and "canvas" | "subtle" | "accent" (React)',
  "eyebrow/title/description": "string (Svelte section header)",
  gap: '"none" | "xs" | "sm" | "md" | "lg" | "xl"',
  align: '"start" | "center" | "end" | "stretch" | "baseline"',
  justify: '"start" | "center" | "end" | "between"',
  wrap: "boolean",
  variant: "component-specific string union",
  loading: "boolean",
  fullWidth: "boolean",
  "leading/startIcon": "Snippet (Svelte) | LucideIcon or ReactNode (React)",
  "trailing/endIcon": "Snippet (Svelte) | LucideIcon or ReactNode (React)",
  "icon/children": "LucideIcon (React) | icon snippet (Svelte)",
  label: "string | renderable content",
  "htmlFor/forId": "string",
  "hint/description": "string | renderable content",
  error: "string | renderable content",
  required: "boolean",
  "hintId/errorId": "string (React)",
  "leading/trailing": "Snippet (Svelte)",
  "options/children": "SelectOption[] (Svelte) | option children",
  placeholder: "string",
  "checked/defaultChecked": "boolean; controlled or initial state",
  indeterminate: "boolean",
  onCheckedChange: "(checked: boolean) => void (Svelte)",
  state: '"idle" | "verifying" | "success" | "error"',
  removable: "boolean",
  removeLabel: "string",
  onRemove: "() => void",
  icon: "LucideIcon (React) | Snippet (Svelte)",
  dismissible: "boolean (Svelte)",
  dismissLabel: "string",
  onDismiss: "() => void",
  padding: '"none" | "sm" | "md" | "lg"',
  title: "string | renderable content",
  description: "string | renderable content",
  action: "renderable content",
  code: "string",
  language: "string",
  showLanguage: "boolean",
  copyable: "boolean",
  copyLabel: "string",
  copiedLabel: "string",
  copyErrorLabel: "string",
  copyResetAfter: "number (milliseconds)",
  entries: "readonly { command: string; output?: string }[]",
  prompt: "string",
  outputLabel: "string",
  density: '"comfortable" | "compact"',
  headerTone: '"strong" | "muted"',
  striped: "boolean",
  minWidth: "CSS length",
  "containerClassName/containerClass": "string",
  "page/currentPage": "number",
  "totalPages/items": "number (Svelte) | PaginationItem[] (React)",
  "previousHref/nextHref": "string (React)",
  getHref: "(page: number) => string (Svelte)",
  siblingCount: "number (Svelte)",
  onPageChange: "(page: number) => void",
  "open/defaultOpen": "boolean; controlled or initial state",
  open: "boolean",
  onOpenChange: "(open: boolean) => void",
  trigger: "ReactNode | Svelte snippet with trigger controls",
  "triggerLabel/label": "string",
  triggerLabel: "string",
  footer: "ReactNode | Svelte snippet",
  closeLabel: "string",
  placement: '"top" | "right" | "bottom" | "left"',
  items: "readonly adapter-specific item[]",
  onSelect: "(item: MenuItem) => void",
  onValueChange: "(value: string | readonly string[]) => void",
  "items/tabs": "ReactTabItem[] (React) | TabItem[] (Svelte)",
  "activation/activationMode": '"automatic" | "manual"',
  "value/defaultValue": "string or string[]; controlled or initial value",
  orientation: '"horizontal" | "vertical"',
  multiple: "boolean",
  "trigger/children": "ReactElement | Svelte snippet | native trigger element",
  content: "renderable content",
  delay: "number (milliseconds)",
  "limit/defaultDuration": "number (React)",
  "viewport/position": "boolean and viewport corner (Svelte)",
  position: '"top-left" | "top-right" | "bottom-left" | "bottom-right"',
  animate: "boolean",
  rainbow: "boolean",
  brand: "string | renderable content",
  brandLabel: "string",
  "homeHref/brandHref": "string",
  links: "readonly LinkItem[]",
  actions: "ReactNode | Svelte snippet",
  brandContent: "Svelte snippet",
  menuLabel: "string",
  menuToggleLabel: "string",
  collapseAt: '"mobile" | "tablet" | "never"',
  menuVariant: '"floating" | "inline"',
  surface: '"solid" | "translucent"',
  groups: "readonly FooterGroup[]",
  "legal/copyright": "renderable content (React) | string (Svelte)",
  post: "PostModel",
  headingLevel: "2 | 3 | 4",
  eyebrow: "string | ReactNode",
  result: "PostModel",
  query: "string",
  image: "ResponsiveImageModel",
  name: "string",
  alt: "string",
  "referrerPolicy/referrerpolicy": "HTML referrer policy",
  darkImage: "ResponsiveImageModel",
  caption: "string | renderable content",
  aspectRatio: "CSS aspect-ratio string",
  fit: '"cover" | "contain" | "fill" (Svelte)',
  priority: "boolean (Svelte)",
  messages: "readonly ChatMessage[]",
  rotation: "-6 | -3 | 0 | 3 | 6",
  "data-image": '"true" when the sticker contains an image',
  children: "ReactNode | Svelte Snippet | child HTML",
  sticker: "AnimatedStickerModel",
  preload: '"none" | "metadata" | "auto" | ""',
  playback: '"auto" | "static"',
  "enabled/defaultEnabled": "boolean; controlled or initial global state",
  onEnabledChange: "(enabled: boolean) => void",
};

const parameterDefaults: Record<string, string> = {
  preference: "context / bindable",
  defaultPreference: '"system"',
  storageKey: '"cf-theme"',
  cycle: '["system", "light", "dark"]',
  showLabel: "true",
  "targetId/href": '"main-content" / "#main-content"',
  "level/as": '2 / "h2"',
  as: "component default",
  size: '"md"',
  tone: '"neutral"',
  external: "false",
  "quiet/underline": 'false / "always"',
  gap: '"md"',
  align: '"stretch"',
  justify: '"start"',
  wrap: "true",
  variant: '"primary" or component default',
  loading: "false",
  fullWidth: "false",
  required: "false",
  indeterminate: "false",
  state: '"idle"',
  removable: "false",
  dismissible: "false",
  padding: '"md"',
  showLanguage: "true when language is set",
  copyable: "true",
  copyLabel: '"Copy"',
  copiedLabel: '"Copied"',
  copyErrorLabel: '"Try again"',
  copyResetAfter: "1800",
  prompt: '"$"',
  outputLabel: '"Command output"',
  density: '"comfortable"',
  headerTone: '"strong"',
  striped: "true",
  minWidth: '"36rem"',
  "page/currentPage": "1",
  siblingCount: "1",
  "open/defaultOpen": "false",
  open: "false",
  placement: '"bottom"',
  orientation: '"horizontal"',
  "activation/activationMode": '"automatic"',
  multiple: "false",
  delay: "1000",
  "limit/defaultDuration": "3 / 5000",
  "viewport/position": 'true / "bottom-right"',
  position: '"bottom-right"',
  animate: "false",
  rainbow: "false",
  brand: '"cofob"',
  "homeHref/brandHref": '"/"',
  menuLabel: '"Toggle navigation"',
  menuToggleLabel: '"Menu"',
  collapseAt: '"mobile"',
  menuVariant: '"floating"',
  surface: '"solid"',
  headingLevel: "3",
  aspectRatio: "intrinsic image ratio",
  fit: '"cover"',
  priority: "false",
  rotation: "-3",
  "enabled/defaultEnabled": "true",
};

const parameterDescriptions: Record<string, string> = {
  preference: "Controlled theme preference.",
  defaultPreference: "Initial preference for uncontrolled usage.",
  onPreferenceChange: "Runs after the user selects a new theme preference.",
  storageKey: "Browser storage key shared by ThemeScript and ThemeProvider.",
  nonce: "CSP nonce forwarded to the inline before-paint script.",
  cycle: "Order used when the toggle advances through theme preferences.",
  labels: "Localized visible and accessible labels.",
  showLabel: "Shows the current preference text beside the icon.",
  "targetId/href": "Main content destination; React accepts an ID, while Svelte and HTML accept an href.",
  "level/as": "Chooses the semantic heading element independently from its visual size.",
  as: "Chooses the rendered semantic element.",
  size: "Applies a design-system size token.",
  tone: "Applies semantic color intent without hard-coded colors.",
  href: "Navigation destination; makes Card interactive when provided.",
  external: "Adds safe new-tab behavior and an external-link affordance.",
  "quiet/underline": "Controls link emphasis and underline behavior for each adapter.",
  "spacing/surface": "React section spacing and semantic surface treatment.",
  "eyebrow/title/description": "Svelte convenience content for the section heading block.",
  gap: "Sets token-based space between child elements.",
  align: "Controls cross-axis alignment.",
  justify: "Controls main-axis distribution.",
  wrap: "Allows inline children to wrap on narrow viewports.",
  variant: "Selects the component's visual treatment.",
  loading: "Shows progress, preserves width, and disables repeated activation.",
  fullWidth: "Expands the Svelte button to its container width.",
  "leading/startIcon": "Supplies leading icon content using the adapter's composition API.",
  "trailing/endIcon": "Supplies trailing icon content using the adapter's composition API.",
  "icon/children": "Supplies the only visible icon while label remains accessible.",
  label: "Visible or accessible name, depending on the component.",
  "htmlFor/forId": "Associates the field label with its form control.",
  "hint/description": "Supporting text announced with the control.",
  error: "Validation message and invalid visual/ARIA state.",
  required: "Marks the label and control as required.",
  "hintId/errorId": "Overrides generated descriptive IDs in React.",
  "value/defaultValue": "Use the first form for controlled state and the second for initial state.",
  "leading/trailing": "Decorative or interactive Svelte snippets inside the input shell.",
  "options/children": "Provides native option elements or structured Svelte option data.",
  placeholder: "Svelte placeholder option shown before a selection.",
  "checked/defaultChecked":
    "Use checked/bind:checked for controlled state or defaultChecked for initial state.",
  indeterminate: "Displays a mixed checkbox state without changing its submitted value.",
  onCheckedChange: "Svelte callback fired after switch state changes.",
  state: "Controlled visual state; the Captcha intentionally contains no verification logic.",
  removable: "Shows a remove action on a tag.",
  removeLabel: "Accessible name for the tag remove action.",
  onRemove: "Runs when the tag remove action is activated.",
  icon: "Overrides the default semantic icon.",
  dismissible: "Shows the Svelte alert dismiss action.",
  dismissLabel: "Accessible name for a dismiss or close action.",
  onDismiss: "Runs after a dismiss action is activated.",
  padding: "Controls internal card spacing.",
  title: "Primary heading or accessible title.",
  description: "Supporting explanatory content.",
  action: "Optional next action rendered in the empty state.",
  code: "Exact source text to render and copy.",
  language: "Syntax language identifier and optional visible label.",
  showLanguage: "Controls whether the language label is visible.",
  copyable: "Enables the clipboard action.",
  copyLabel: "Initial accessible copy button text.",
  copiedLabel: "Temporary success label after copying.",
  copyErrorLabel: "Error label when clipboard access fails.",
  copyResetAfter: "Delay before the copy action returns to its initial label.",
  entries:
    "Ordered terminal commands with optional automatically parsed ANSI output kept separate from copyable commands.",
  prompt: "Visual prompt prefix; it is never included in copied command text.",
  outputLabel: "Accessible name for command output regions.",
  density: "Controls table cell and caption padding.",
  headerTone: "Chooses a high-contrast dark or quiet muted column-header surface.",
  striped: "Adds a subtle semantic surface to alternating body rows.",
  minWidth: "Sets the table width before the labelled container begins horizontal scrolling.",
  "containerClassName/containerClass": "Adds a class to the labelled scroll container.",
  "page/currentPage": "Current page; bindable in Svelte and controlled in React.",
  "totalPages/items": "Defines the page range in Svelte or explicit navigation items in React.",
  "previousHref/nextHref": "Explicit React destinations for adjacent pages.",
  getHref: "Builds Svelte page links without coupling to a router.",
  siblingCount: "Number of page links around the active Svelte page.",
  onPageChange: "Runs before client-side page navigation.",
  "open/defaultOpen": "Use open/bind:open for controlled state or defaultOpen for initial state.",
  open: "Bindable Svelte navigation-menu state.",
  onOpenChange: "Reports every user-driven open state transition.",
  trigger: "Trigger content; Svelte snippets receive accessible trigger controls.",
  triggerLabel: "Fallback accessible name when trigger content has no text.",
  "triggerLabel/label": "Accessible trigger name; adapter name differs.",
  footer: "Optional dialog action area.",
  closeLabel: "Accessible name for the dialog or toast close button.",
  placement: "Preferred side; collision handling may choose a safer position.",
  items: "Structured items including IDs, labels, disabled state, and optional destinations.",
  onSelect: "Runs when an enabled menu item is selected.",
  onValueChange: "Reports a user-driven tab or accordion value change.",
  "items/tabs": "Ordered tab records; content is ReactNode or a Svelte string/snippet.",
  "activation/activationMode": "Chooses arrow-key activation or manual Enter/Space activation.",
  orientation: "Sets layout and the matching keyboard navigation axis.",
  multiple: "Allows more than one accordion item to stay open.",
  "trigger/children": "The focusable element described by the tooltip.",
  content: "Tooltip text or tab/disclosure content.",
  delay: "Hover delay; keyboard focus remains immediate.",
  "limit/defaultDuration": "React queue capacity and default auto-dismiss duration.",
  "viewport/position": "Svelte provider-owned viewport visibility and placement.",
  position: "Viewport corner for transient notifications.",
  animate: "Enables the marker drawing motion unless reduced motion is requested.",
  rainbow: "Uses the multicolor brand marker instead of sky blue.",
  brand: "Brand text or custom brand content.",
  brandLabel: "Accessible label for a non-text brand.",
  "homeHref/brandHref": "Router-independent home destination.",
  links: "Portable link records with href, label, external, and current fields.",
  actions: "Optional actions at the end of the navigation bar.",
  brandContent: "Svelte snippet replacing plain brand text.",
  menuLabel: "Accessible name for the mobile navigation toggle.",
  menuToggleLabel: "Accessible name announced by the disclosure control.",
  collapseAt: "Breakpoint where navigation moves into its disclosure menu.",
  menuVariant: "Chooses floating or in-flow disclosure-menu geometry.",
  surface: "Chooses solid or translucent navbar surface tokens.",
  groups: "Footer link columns.",
  "legal/copyright": "Legal/copyright content; adapter naming differs.",
  post: "Portable post metadata including URL, title, dates, tags, and cover image.",
  headingLevel: "Semantic heading level inside a post card.",
  eyebrow: "Short label above the latest-post title.",
  result: "Portable post record rendered as a search result.",
  query: "Search phrase used to emphasize matching title text.",
  image: "Light-theme responsive source, alternative text, dimensions, and srcset data.",
  name: "Person or entity name used to derive accessible initials.",
  alt: "Alternative text; use an empty string when the image is decorative.",
  "referrerPolicy/referrerpolicy": "Controls referrer data sent while loading a remote avatar.",
  darkImage: "Optional dark-theme source with its own intrinsic metadata.",
  caption: "Visible caption for a figure or table.",
  aspectRatio: "Reserves layout space before the image loads.",
  fit: "Svelte object-fit behavior.",
  priority: "Svelte eager-loading and high-priority hint.",
  messages: "Ordered accessible chat messages with author, body, time, ownership, and avatar.",
  rotation: "Small tokenized decorative rotation.",
  "data-image": "Removes label-like padding when Sticker wraps an attributed image.",
  children: "Idiomatic adapter composition content.",
  sticker:
    "Converted WebM URL, dimensions, and either a trusted sanitized skeletonSvg for vector animation or firstFrameSrc for a video-based WebP first frame. Never pass unchecked user SVG.",
  preload:
    "Native video preload hint; the SVG/WebP first frame is present in SSR HTML and is removed from the DOM after playback starts. Auto playback pauses outside the viewport and resumes when visible again.",
  playback:
    'Use "static" to render only the SVG/WebP first frame and omit video entirely, guaranteeing no WebM request.',
  "enabled/defaultEnabled":
    "Controls the persisted document-wide data-cf-animated-stickers flag. Disabled mode unloads WebM and restores each SVG/WebP first frame; ordinary static stickers are unchanged.",
  onEnabledChange: "Runs after the global animated sticker preference changes through this control.",
};

const requiredParameters: Record<string, readonly string[]> = {
  IconButton: ["label", "icon/children"],
  Field: ["label"],
  CodeBlock: ["code"],
  TerminalCodeBlock: ["entries"],
  Table: ["label"],
  Pagination: ["page/currentPage", "totalPages/items"],
  Dialog: ["title"],
  DropdownMenu: ["items"],
  Tabs: ["items/tabs"],
  Accordion: ["items"],
  Tooltip: ["content", "trigger/children"],
  Navbar: ["links"],
  PostCard: ["post"],
  LatestPostCard: ["post"],
  SearchResultCard: ["result"],
  ResponsiveImage: ["image"],
  Avatar: ["name"],
  InlineEmoji: ["image"],
  ChatThread: ["messages"],
  AnimatedSticker: ["sticker", "alt"],
};

const adapterOverrides: Record<string, readonly Adapter[]> = {
  showLabel: ["Svelte", "HTML"],
  fullWidth: ["Svelte", "HTML"],
  "hintId/errorId": ["React"],
  "leading/trailing": ["Svelte"],
  placeholder: ["Svelte", "HTML"],
  onCheckedChange: ["Svelte"],
  dismissible: ["Svelte", "HTML"],
  "previousHref/nextHref": ["React", "HTML"],
  getHref: ["Svelte", "HTML"],
  siblingCount: ["Svelte", "HTML"],
  closeLabel: ["React", "Svelte", "HTML"],
  "limit/defaultDuration": ["React", "HTML"],
  "viewport/position": ["Svelte", "HTML"],
  brandContent: ["Svelte"],
  fit: ["Svelte", "HTML"],
  priority: ["Svelte", "HTML"],
};

const componentAdapterOverrides: Record<string, Record<string, readonly Adapter[]>> = {
  ThemeToggle: {
    preference: ["Svelte", "HTML"],
    showLabel: ["Svelte", "HTML"],
    onPreferenceChange: ["Svelte"],
  },
  Button: {
    tone: ["Svelte", "HTML"],
    fullWidth: ["Svelte", "HTML"],
  },
  IconButton: {
    tone: ["Svelte", "HTML"],
  },
  Badge: {
    variant: ["Svelte", "HTML"],
  },
  Tag: {
    size: ["Svelte", "HTML"],
  },
  Alert: {
    dismissible: ["Svelte", "HTML"],
  },
  Card: {
    as: ["React", "HTML"],
  },
  Navbar: {
    brandContent: ["Svelte"],
  },
  ResponsiveImage: {
    fit: ["Svelte", "HTML"],
    priority: ["Svelte", "HTML"],
  },
};

const componentParameterTypes: Record<string, Record<string, string>> = {
  Container: {
    size: '"sm" | "md" | "lg" | "full" (React) · "narrow" | "default" | "wide" | "full" (Svelte)',
  },
  Heading: {
    size: '"sm" | "md" | "lg" | "xl" | "2xl"',
  },
  Avatar: {
    loading: '"eager" | "lazy"',
  },
  Badge: {
    variant: '"soft" | "solid" | "outline" (Svelte)',
  },
  Card: {
    variant: '"default" | "elevated" | "outlined" | "interactive"',
  },
  Button: {
    variant: '"primary" | "secondary" | "ghost" | "danger"',
  },
  IconButton: {
    variant: '"primary" | "secondary" | "ghost" | "danger"',
  },
};

const componentParameterDefaults: Record<string, Record<string, string>> = {
  TerminalCodeBlock: { copyLabel: '"Copy command"' },
  SkipLink: {
    "targetId/href": '"main-content" / "#main-content"',
  },
  Heading: { size: "semantic default for level" },
  Container: { size: '"lg" (React) / "default" (Svelte)' },
  Section: { "spacing/surface": '"lg" / "canvas" (React)' },
  Inline: { align: '"center"' },
  IconButton: { variant: '"secondary"' },
  Badge: { variant: '"soft" (Svelte)' },
  Tag: { removeLabel: '"Remove" (React) / "Remove tag" (Svelte)' },
  Alert: { tone: '"info"', dismissLabel: '"Dismiss"' },
  Card: { as: '"div"', variant: '"default"' },
  Pagination: { label: '"Pagination"', "totalPages/items": "1 (Svelte) / required (React)" },
  Dialog: { triggerLabel: '"Open dialog"', closeLabel: '"Close dialog"' },
  Popover: { "triggerLabel/label": '"Toggle popover" / "Open popover"' },
  DropdownMenu: { "triggerLabel/label": '"Open menu"', size: '"md"' },
  Tabs: { label: '"Tabs"' },
  Tooltip: { placement: '"top"' },
  ToastProvider: {
    "limit/defaultDuration": "5 / 5000 (React)",
    "viewport/position": 'true / "bottom-right" (Svelte)',
  },
  ToastViewport: { label: '"Notifications"', closeLabel: '"Dismiss notification" (React)' },
  Navbar: { menuLabel: '"Navigation" / "Main navigation"' },
  LatestPostCard: { eyebrow: '"Latest post"', headingLevel: "2" },
  PostCard: { headingLevel: "2" },
  SearchResultCard: { headingLevel: "2" },
  Avatar: { size: '"md"', loading: '"lazy"', "referrerPolicy/referrerpolicy": '"no-referrer"' },
  InlineEmoji: { "referrerPolicy/referrerpolicy": '"no-referrer"' },
  MediaGrid: { as: '"ul"' },
  ChatThread: { label: '"Conversation"' },
  AnimatedSticker: { playback: '"auto"', preload: '"metadata"' },
  AnimatedStickerToggle: { label: '"Animated stickers"', size: '"md"' },
};

const attributeParameter = (name: string) => name.endsWith(" attributes");

const parameterExamples: Record<string, string> = {
  preference: '"dark"',
  defaultPreference: '"system"',
  storageKey: '"cf-theme"',
  nonce: "nonce",
  cycle: '["system", "light", "dark"]',
  labels: '{{ system: "System theme", light: "Light theme", dark: "Dark theme" }}',
  "targetId/href": '"main-content" / "#main-content"',
  "level/as": '2 / "h2"',
  as: '"article"',
  external: "true",
  "quiet/underline": 'true / "hover"',
  "spacing/surface": 'spacing="lg" surface="subtle"',
  "eyebrow/title/description": 'eyebrow="Guide" title="Install" description="Start here"',
  "leading/startIcon": "leading snippet / startIcon={Save}",
  "trailing/endIcon": "trailing snippet / endIcon={ArrowRight}",
  "icon/children": "{Plus} / icon snippet",
  "htmlFor/forId": '"email"',
  "hint/description": '"We will only use this for updates."',
  error: '"Enter a valid value."',
  "hintId/errorId": 'hintId="email-hint" errorId="email-error"',
  "leading/trailing": "leading search snippet / trailing clear snippet",
  placeholder: '"Choose an option"',
  description: '"Supporting context for this control."',
  title: '"No posts yet"',
  icon: "Inbox / icon snippet",
  action: "<Button>Create a post</Button>",
  caption: '"Build results by package"',
  "containerClassName/containerClass": '"docs-table-shell"',
  "page/currentPage": "3",
  "totalPages/items": "12 / {items}",
  siblingCount: "2",
  trigger: "<Button>Open</Button> / trigger snippet",
  footer: "<Button>Confirm</Button> / footer snippet",
  "activation/activationMode": '"manual"',
  content: '"Keyboard shortcuts"',
  "trigger/children": '<IconButton label="Help" /> / trigger snippet',
  "limit/defaultDuration": "5 / 5000",
  "viewport/position": 'true / "bottom-right"',
  brand: '"cofob"',
  actions: "<ThemeToggle /> / actions snippet",
  brandContent: "brandContent snippet",
  collapseAt: '"tablet"',
  menuVariant: '"floating"',
  surface: '"translucent"',
  "legal/copyright": '"© 2026 cofob"',
  headingLevel: "2",
  eyebrow: '"Latest post"',
  query: '"design system"',
  name: '"Ada Lovelace"',
  alt: '"Ada Lovelace"',
  "referrerPolicy/referrerpolicy": '"no-referrer"',
  "data-image": 'data-image="true"',
  playback: '"static"',
};

const componentParameterExamples: Record<string, Record<string, string>> = {
  Captcha: {
    labels: '{{ idle: "Verify", verifying: "Checking…", success: "Done", error: "Try again" }}',
  },
  EmptyState: {
    description: '"Publish your first note to get started."',
  },
  Dialog: {
    title: '"Delete draft?"',
    description: '"This action cannot be undone."',
  },
  Footer: {
    description: '"Independent software and notes."',
  },
  ResponsiveImage: {
    caption: '"The dashboard in light and dark themes."',
  },
  Avatar: {
    image: "{avatar}",
  },
  InlineEmoji: {
    image: "{emoji}",
  },
};

function parameterExample(component: string, name: string): string {
  if (attributeParameter(name)) return "class / style / aria-* / data-*";
  if (name === "children") return "children / snippet / child HTML";
  const documented = componentParameterExamples[component]?.[name] ?? parameterExamples[name];
  if (documented) return documented;
  if (name.startsWith("on")) return `{handle${name.slice(2)}}`;
  if (name.includes("value")) return component === "Accordion" ? '["overview"]' : '"overview"';
  if (name.includes("checked")) return "true";
  if (name.includes("open")) return "true";
  if (name.includes("Href") || name === "href") return '"/guide"';
  if (name === "size") return '"md"';
  if (name === "tone") return '"success"';
  if (
    [
      "loading",
      "fullWidth",
      "required",
      "indeterminate",
      "removable",
      "dismissible",
      "animate",
      "rainbow",
      "multiple",
      "priority",
      "wrap",
      "showLabel",
      "showLanguage",
      "copyable",
      "striped",
    ].includes(name)
  )
    return "true";
  if (name === "density") return '"compact"';
  if (name === "headerTone") return '"muted"';
  if (name === "minWidth") return '"48rem"';
  if (name === "placement") return '"bottom"';
  if (name === "position") return '"bottom-right"';
  if (name === "rotation") return "-3";
  if (name === "delay") return "1000";
  if (name === "copyResetAfter") return "1800";
  if (name === "state") return '"verifying"';
  if (name === "language") return '"typescript"';
  if (name === "code") return '"const ready = true;"';
  if (name === "prompt") return '"$"';
  if (name === "aspectRatio") return '"16 / 9"';
  if (name === "orientation") return '"horizontal"';
  if (name === "variant") return '"secondary"';
  if (name === "padding") return '"lg"';
  if (name === "gap") return '"lg"';
  if (name === "align") return '"center"';
  if (name === "justify") return '"between"';
  if (name === "fit") return '"cover"';
  if (name === "alt") return '"Accessible description"';
  if (name.includes("Label") || name === "label") return '"Accessible label"';
  if (["items", "items/tabs", "options/children", "entries", "links", "groups", "messages"].includes(name))
    return `{${name.split("/")[0]}}`;
  if (["post", "result", "image", "darkImage", "sticker"].includes(name)) return `{${name}}`;
  return `{${name.replaceAll("/", "Or")}}`;
}

function getParameterDocs(component: string): ParameterDoc[] {
  const required = new Set(requiredParameters[component] ?? []);
  return (props[component] ?? ["children", "native attributes"]).map((name) => ({
    name,
    type: attributeParameter(name)
      ? "native element attributes"
      : (componentParameterTypes[component]?.[name] ?? parameterTypes[name] ?? "adapter-specific"),
    defaultValue: required.has(name)
      ? "required"
      : (componentParameterDefaults[component]?.[name] ?? parameterDefaults[name] ?? "—"),
    required: required.has(name),
    adapters: componentAdapterOverrides[component]?.[name] ?? adapterOverrides[name] ?? allAdapters,
    description: attributeParameter(name)
      ? "Forwards native class/style, accessibility, event, and data attributes to the root element."
      : (parameterDescriptions[name] ?? `Configures ${name.replaceAll("/", " or ")}.`),
    example: parameterExample(component, name),
  }));
}

const stateOverrides: Record<string, readonly string[]> = {
  ThemeProvider: ["light", "dark", "system"],
  ThemeScript: ["before paint", "storage unavailable"],
  ThemeToggle: ["light", "dark", "system", "focus-visible"],
  AppShell: ["short content", "sticky footer", "overflowing content"],
  Button: ["primary", "secondary", "ghost", "danger", "loading", "disabled"],
  TextField: ["default", "focus", "disabled", "error"],
  Textarea: ["default", "focus", "disabled", "error"],
  Select: ["default", "focus", "disabled", "error"],
  Checkbox: ["unchecked", "checked", "indeterminate", "disabled"],
  Switch: ["unchecked", "checked", "disabled"],
  Captcha: ["idle", "verifying", "success", "error", "disabled"],
  Badge: ["neutral", "accent", "info", "success", "warning", "danger"],
  Alert: ["info", "success", "warning", "danger", "dismissible"],
  Card: ["default", "outlined", "elevated", "interactive"],
  CodeBlock: ["without toolbar", "language", "copyable", "copied", "copy error"],
  TerminalCodeBlock: [
    "command",
    "plain output",
    "ANSI color/style output",
    "OSC 8 hyperlink",
    "copied command",
    "copy error",
  ],
  Table: ["comfortable", "compact", "strong/muted header", "striped", "horizontal overflow", "focus-visible"],
  Dialog: ["closed", "open", "cancelled"],
  Popover: ["closed", "open", "light-dismiss"],
  DropdownMenu: ["closed", "open", "disabled", "destructive"],
  Tabs: ["active", "inactive", "disabled", "automatic/manual"],
  Accordion: ["closed", "open", "disabled", "single/multiple"],
  Tooltip: ["closed", "hover", "focus", "Escape"],
  ToastProvider: ["empty", "queued", "dismissed"],
  ToastViewport: ["polite", "danger alert", "dismissed"],
  Avatar: ["responsive image", "initials fallback", "sm", "md", "lg", "decorative"],
  InlineEmoji: ["named", "decorative", "inline alignment"],
  MediaGrid: ["one item", "two columns", "image/video/audio"],
  Sticker: ["label", "image", "attributed image"],
  AnimatedSticker: [
    "loading",
    "playing",
    "offscreen paused",
    "static SVG only",
    "globally disabled",
    "reduced motion",
    "load/play fallback",
  ],
  AnimatedStickerToggle: ["enabled", "disabled", "focus-visible", "form disabled"],
};

const reactUsage: Record<string, string> = {
  ThemeProvider: "<ThemeProvider><App /></ThemeProvider>",
  ThemeScript: "<ThemeScript nonce={nonce} />",
  ThemeToggle: "<ThemeToggle />",
  SkipLink: '<SkipLink targetId="content" />',
  AppShell: "<AppShell><Header /><main>Content</main><Footer /></AppShell>",
  Link: '<Link href="/guide">Guide</Link>',
  Prose: '<Prose size="default">…</Prose>',
  IconButton: '<IconButton label="Add" icon={Plus} />',
  Field: '<Field label="Email"><input /></Field>',
  TextField: '<TextField label="Email" />',
  Textarea: '<Textarea label="Notes" />',
  Select: '<Select label="Theme"><option>System</option></Select>',
  Checkbox: '<Checkbox label="Include drafts" />',
  Switch: '<Switch label="Dark mode" />',
  Captcha: '<Captcha state="idle" onClick={startVerification} />',
  EmptyState: '<EmptyState title="No posts" />',
  CodeBlock: '<CodeBlock code={source} language="typescript" />',
  TerminalCodeBlock:
    '<TerminalCodeBlock entries={[{ command: "npm run build", output: "\\u001b[1;32mBuild complete\\u001b[0m" }]} />',
  Table: '<Table label="Package comparison"><thead>…</thead><tbody>…</tbody></Table>',
  Pagination: "<Pagination currentPage={1} items={items} />",
  Dialog: '<Dialog trigger="Open" title="Confirm">Content</Dialog>',
  Popover: '<Popover trigger="Open">Content</Popover>',
  DropdownMenu: '<DropdownMenu trigger="Actions" items={items} />',
  Tabs: "<Tabs items={items} />",
  Accordion: "<Accordion items={items} />",
  Tooltip: '<Tooltip content="Help"><button>?</button></Tooltip>',
  ToastProvider: "<ToastProvider><App /></ToastProvider>",
  ToastViewport: "<ToastViewport />",
  Navbar: "<Navbar links={links} />",
  Footer: "<Footer groups={groups} />",
  PostCard: "<PostCard post={post} />",
  LatestPostCard: "<LatestPostCard post={post} />",
  SearchResultCard: "<SearchResultCard result={post} />",
  ResponsiveImage: "<ResponsiveImage image={image} />",
  Avatar: '<Avatar image={avatar} name="Ada Lovelace" />',
  InlineEmoji: '<InlineEmoji image={emoji} alt="Sparkles" />',
  MediaGrid: "<MediaGrid>{mediaItems}</MediaGrid>",
  ChatThread: "<ChatThread messages={messages} />",
  Sticker:
    '<figure><Sticker data-image="true"><img src="/sticker.webp" alt="A delighted fox" /></Sticker><figcaption>Source: …</figcaption></figure>',
  AnimatedSticker:
    '<><AnimatedSticker sticker={manifest.sticker} alt="Animated cartoon rat Chris" /><AnimatedSticker sticker={manifest.sticker} alt="Static first frame" playback="static" /></>',
  AnimatedStickerToggle:
    '<AnimatedStickerToggle defaultEnabled label="Animated stickers" onEnabledChange={setEnabled} />',
};

const svelteUsage: Record<string, string> = {
  ...reactUsage,
  ThemeProvider: "<ThemeProvider>{@render children()}</ThemeProvider>",
  Heading: '<Heading as="h2">Title</Heading>',
  Field: '<Field label="Email" forId="email"><input id="email" /></Field>',
  TextField: '<TextField label="Email" bind:value />',
  Textarea: '<Textarea label="Notes" bind:value />',
  Select: '<Select label="Theme" options={options} bind:value />',
  Checkbox: '<Checkbox label="Include drafts" bind:checked />',
  Switch: '<Switch label="Dark mode" bind:checked />',
  Captcha: "<Captcha state={captchaState} onclick={startVerification} />",
  CodeBlock: '<CodeBlock code={source} language="typescript" />',
  TerminalCodeBlock:
    '<TerminalCodeBlock entries={[{ command: "npm run build", output: "\\u001b[1;32mBuild complete\\u001b[0m" }]} />',
  Table: '<Table label="Package comparison"><thead>…</thead><tbody>…</tbody></Table>',
  Sticker:
    '<figure><Sticker data-image="true"><img src="/sticker.webp" alt="A delighted fox" /></Sticker><figcaption>Source: …</figcaption></figure>',
  AnimatedSticker:
    '<AnimatedSticker sticker={manifest.sticker} alt="Animated cartoon rat Chris" />\n<AnimatedSticker sticker={manifest.sticker} alt="Static first frame" playback="static" />',
  AnimatedStickerToggle:
    '<AnimatedStickerToggle bind:enabled label="Animated stickers" onEnabledChange={setEnabled} />',
  Pagination: "<Pagination bind:page totalPages={12} />",
  Dialog:
    '<Dialog title="Confirm">{#snippet trigger({ open })}<Button onclick={open}>Open</Button>{/snippet}Content</Dialog>',
  Popover: '<Popover label="Open">Content</Popover>',
  DropdownMenu: '<DropdownMenu label="Actions" items={items} />',
};

const nativeUsage: Record<string, string> = {
  ThemeProvider: '<html data-theme="dark" data-theme-preference="dark">…</html>',
  ThemeScript: "<script>/* getThemeScript() */</script>",
  ThemeToggle: '<button class="cf-theme-toggle" data-cf-theme-toggle>Theme</button>',
  SkipLink: '<a class="cf-skip-link" href="#content">Skip to content</a>',
  AppShell: '<div class="cf-app-shell"><header>…</header><main>…</main><footer>…</footer></div>',
  Heading: '<h2 class="cf-heading" data-level="2">Title</h2>',
  Text: '<p class="cf-text" data-tone="muted">Metadata</p>',
  Link: '<a class="cf-link" href="/guide">Guide</a>',
  Prose: '<article class="cf-prose" data-size="default">…</article>',
  Container: '<div class="cf-container">…</div>',
  Section: '<section class="cf-section">…</section>',
  Button: '<button class="cf-button" data-variant="primary">Save</button>',
  IconButton: '<button class="cf-icon-button" aria-label="Add">+</button>',
  Field: '<label class="cf-field">Email <input class="cf-input" /></label>',
  TextField: '<input class="cf-input" type="email" />',
  Textarea: '<textarea class="cf-textarea"></textarea>',
  Select: '<select class="cf-select"><option>System</option></select>',
  Checkbox: '<label class="cf-checkbox"><input type="checkbox" /> Include drafts</label>',
  Switch: '<button class="cf-switch" role="switch" aria-checked="false">Dark mode</button>',
  Captcha: '<button class="cf-captcha" data-state="idle">…</button>',
  Badge: '<span class="cf-badge" data-tone="success">Ready</span>',
  Tag: '<span class="cf-tag">design</span>',
  Alert: '<aside class="cf-alert" data-tone="info">Message</aside>',
  Card: '<article class="cf-card" data-padding="md">Content</article>',
  EmptyState: '<div class="cf-empty-state">No posts yet</div>',
  CodeBlock:
    '<div class="cf-code-block" data-cf-copy-scope><button data-cf-copy-button>Copy</button><pre><code data-cf-copy-source>const value = 1;</code></pre></div>',
  TerminalCodeBlock:
    '<div class="cf-terminal-code-block"><div data-cf-copy-scope><code data-cf-copy-source>npm run build</code><button data-cf-copy-button>Copy command</button><pre><code><span class="cf-terminal-output__token" data-bold="true" style="--cf-terminal-token-foreground:var(--cf-terminal-foreground-2)">Build complete</span></code></pre></div></div>',
  Table:
    '<div class="cf-table-container" role="region" aria-label="Package comparison" tabindex="0"><table class="cf-table" data-header-tone="strong" data-striped="true"><thead>…</thead><tbody>…</tbody></table></div>',
  Pagination: '<nav class="cf-pagination" aria-label="Pagination">…</nav>',
  Dialog: '<dialog class="cf-dialog" data-cf-dialog>Content</dialog>',
  Popover: '<div class="cf-popover" popover data-cf-popover>Content</div>',
  DropdownMenu: '<div class="cf-menu" role="menu" data-cf-menu>…</div>',
  Tabs: '<div class="cf-tabs" data-cf-tabs>…</div>',
  Accordion: '<div class="cf-accordion" data-cf-accordion><details>…</details></div>',
  Tooltip: '<span class="cf-tooltip" role="tooltip" data-cf-tooltip>Help</span>',
  ToastProvider: '<div class="cf-toast-viewport" data-cf-toast-viewport></div>',
  ToastViewport: '<div class="cf-toast-viewport" data-cf-toast-viewport></div>',
  BlueLine:
    '<span class="cf-blue-line" data-animate="true"><span class="cf-blue-line__content">cofob</span></span>',
  Navbar: '<nav class="cf-navbar">…</nav>',
  Footer: '<footer class="cf-footer">…</footer>',
  PostCard: '<a class="cf-post-card" href="/post">…</a>',
  LatestPostCard: '<a class="cf-latest-post-card" href="/post">…</a>',
  SearchResultCard: '<a class="cf-search-result-card" href="/post">…</a>',
  ResponsiveImage: '<img class="cf-responsive-image" src="image.jpg" alt="Description" />',
  Avatar: '<span class="cf-avatar" data-size="md"><img src="avatar.jpg" alt="Ada Lovelace" /></span>',
  InlineEmoji: '<img class="cf-inline-emoji" src="sparkles.webp" alt="Sparkles" width="24" height="24" />',
  MediaGrid: '<ul class="cf-media-grid"><li><img src="image.jpg" alt="Description" /></li></ul>',
  ChatThread: '<ol class="cf-chat-thread">…</ol>',
  Sticker:
    '<figure><span class="cf-sticker" data-image="true"><img src="/sticker.webp" alt="A delighted fox" /></span><figcaption>Source: …</figcaption></figure>',
  AnimatedSticker:
    '<span class="cf-animated-sticker" data-cf-animated-sticker data-playback="auto" role="img" aria-label="Animated cartoon rat Chris"><span class="cf-animated-sticker__skeleton" aria-hidden="true"><svg viewBox="0 0 512 512">…</svg></span><video data-cf-animated-sticker-video data-cf-animated-sticker-src="/sticker.hash.webm" muted loop playsinline preload="metadata" aria-hidden="true"></video></span>\n<span class="cf-animated-sticker" data-playback="static" role="img" aria-label="Static first frame"><span class="cf-animated-sticker__skeleton" aria-hidden="true"><svg viewBox="0 0 512 512">…</svg></span></span>',
  AnimatedStickerToggle:
    '<label class="cf-switch cf-animated-sticker-toggle" data-cf-animated-sticker-toggle-root><input class="cf-switch__control" type="checkbox" role="switch" data-cf-animated-sticker-toggle checked><span class="cf-switch__track" aria-hidden="true"><span class="cf-switch__thumb"></span></span><span class="cf-switch__content"><span class="cf-switch__label">Animated stickers</span></span></label>',
};

export function getComponentContract(name: string): ComponentContract {
  const selector = selectorOverrides[name] ?? `.cf-${kebab(name)}`;
  const defaultUsage = `<${name}>Content</${name}>`;
  return {
    selector,
    props: props[name] ?? ["native attributes", "class/style", "children"],
    parameters: getParameterDocs(name),
    states: stateOverrides[name] ?? ["default", "hover/focus where interactive", "disabled where applicable"],
    react: reactUsage[name] ?? defaultUsage,
    svelte: svelteUsage[name] ?? defaultUsage,
    native: nativeUsage[name] ?? `<div class="${selector.replace(/^\./, "")}">Content</div>`,
  };
}

const adapterLabels: Record<Lowercase<Adapter>, Adapter> = {
  react: "React",
  svelte: "Svelte",
  html: "HTML",
};

function parameterReference(contract: ComponentContract, adapter: Adapter, prefix: string): string {
  const parameters = contract.parameters.filter(({ adapters }) => adapters.includes(adapter));
  const detailPrefix = prefix.includes("@param") ? " * " : prefix;
  return parameters
    .map(({ name, type, defaultValue, required, example }) => {
      const presence = required ? "required" : `default: ${defaultValue}`;
      return [
        `${prefix}${name}`,
        `${detailPrefix}  type: ${type}`,
        `${detailPrefix}  ${presence}`,
        `${detailPrefix}  example: ${example}`,
      ].join("\n");
    })
    .join("\n");
}

function indent(source: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return source
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
}

/** Builds the complete copyable example shown by the component documentation page. */
export function getComponentExample(name: string, adapter: Lowercase<Adapter>, interactive = false): string {
  const contract = getComponentContract(name);
  const adapterLabel = adapterLabels[adapter];

  if (adapter === "react") {
    const reference = parameterReference(contract, adapterLabel, " * @param ");
    return `import { ${name} } from "@cofob/design-system-react";

/**
 * Complete ${name} parameter reference.
${reference}
 */
export function ${name}Example() {
  return (
${indent(contract.react, 4)}
  );
}`;
  }

  if (adapter === "svelte") {
    const reference = parameterReference(contract, adapterLabel, "  // ");
    return `<script lang="ts">
  import { ${name} } from "@cofob/design-system-svelte";

  // Complete ${name} parameter reference.
${reference}
</script>

${contract.svelte}`;
  }

  const reference = parameterReference(contract, adapterLabel, "  ");
  const controller = interactive
    ? `

<script type="module">
  import { initDesignSystem } from "@cofob/design-system-css";

  const designSystem = initDesignSystem(document);
  window.addEventListener("pagehide", () => designSystem.destroy(), { once: true });
</script>`
    : "";
  return `<!--
  Complete ${name} parameter reference.
${reference}
-->
${contract.native}${controller}`;
}
