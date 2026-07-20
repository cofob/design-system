# @cofob/design-system-css

Framework-independent design tokens, styles, and optional DOM controllers for
cofob sites. The package has no runtime dependencies and does not access
browser globals while it is imported, so its JavaScript entry is safe during
SSR.

## Install and styles

GitHub Packages requires an authenticated `@cofob` registry configuration:

```ini
@cofob:registry=https://npm.pkg.github.com
```

```sh
npm install @cofob/design-system-css
```

Import the complete precompiled stylesheet once at the application boundary:

```js
import "@cofob/design-system-css/index.css";
```

Granular precompiled entries are available as `tokens.css`, `fonts.css`,
`base.css`, and `components.css`. PostCSS applications can instead import
`@cofob/design-system-css/postcss`; process it with `postcss-import`,
`postcss-custom-media`, `postcss-nesting`, and Autoprefixer. The package does
not include a generated utility layer.

All stable custom properties use `--cf-*`, and public component classes use
`.cf-*`. Semantic color tokens such as `--cf-color-canvas`,
`--cf-color-text`, and `--cf-color-accent` should be preferred over palette
primitives.

## Themes

The contract stores `light | dark | system` in `localStorage` under `cf-theme`,
sets the resolved `light | dark` value on `html[data-theme]`, and records the
preference on `html[data-theme-preference]`. Include the synchronous script in
the document head before styles to avoid a theme flash:

```js
import { getThemeScript } from "@cofob/design-system-css";

const inlineCode = getThemeScript();
```

Then create a controller after mount. Subscriptions fire immediately and
return an unsubscribe function:

```js
import { createThemeController } from "@cofob/design-system-css";

const theme = createThemeController({ root: document.documentElement });
const unsubscribe = theme.subscribe(({ preference, resolvedTheme }) => {
  console.log(preference, resolvedTheme);
});
theme.setPreference("dark");
```

Without JavaScript, the tokens follow `prefers-color-scheme`. Explicit
`data-theme="light"` and `data-theme="dark"` always win.

## Controllers

Controllers are optional progressive enhancement for native markup:

- `createDialogController(dialog)` enhances modal `<dialog>` elements and
  `[data-cf-dialog-trigger]` / `[data-cf-dialog-close]` controls.
- `createPopoverController(popover)` uses the platform Popover API and
  `[data-cf-popover-trigger]`. If that API is unavailable, the controller uses
  `data-cf-fallback-open="true"`, handles outside click and Escape, and returns
  focus. This is the supported older-browser fallback; it does not provide
  top-layer positioning or collision avoidance.
- `createMenuController`, `createTabsController`, and
  `createAccordionController` add arrow/Home/End navigation. Menus also add
  typeahead.
- `createNavbarController(navbar)` enhances the native `details` disclosure in
  `[data-cf-navbar]` with synchronized `data-state`, outside-click and Escape
  dismissal, link closing, and responsive breakpoint reset. Use
  `data-collapse-at="mobile|tablet|never"`,
  `data-menu-variant="floating|flush"`, and
  `data-surface="solid|translucent"` to select the shared presentation.
- `createTooltipController` tethers content to its trigger, opens after a one-second hover or
  immediately on focus/click, and supports click pinning, outside-click dismissal, and Escape.
- `createToastController(viewport)` creates safe text-only notification DOM.
- `createCopyController(root)` enhances `[data-cf-copy-button]` controls. It copies only the
  nearest `[data-cf-copy-source]`, so terminal output can remain in the same visual block without
  entering the clipboard.
- `initDesignSystem(root)` discovers all `data-cf-*` hooks beneath a document,
  element, or shadow root and returns a single cleanup handle.

Every controller exposes `destroy()`. Stateful controllers additionally expose
imperative state methods; their public TypeScript declarations are included in
the package.

## Animated sticker preference

`setAnimatedStickersEnabled(false)` unloads animated WebM stickers and preserves the choice in
`localStorage` under `cf-animated-stickers`. Controllers restore it on the next page load before
assigning any video `src`. Use `AnimatedStickerToggle` in React/Svelte or
`createAnimatedStickerToggleController()` for native HTML. Vector animations retain their trusted
inline SVG first frame; video-based animations use an optimized WebP first frame.

## Captcha presentation

The `.cf-captcha` class contract exposes `idle`, `verifying`, `success`, and
`error` through `data-state`, plus the native `disabled` attribute. It is
presentation-only and deliberately ships no verification controller or
business logic. The motion contract was informed by the public
[Cap widget](https://github.com/tiagozip/cap), licensed Apache-2.0; see
`LICENSES/CAP-REFERENCE.md` for attribution and scope.

## Code presentation

Use `.cf-code-block` for source code with an optional language toolbar and copy action. Use
`.cf-terminal-code-block` for transcripts: every `.cf-terminal-code-block__entry` owns one command
source and optional output, allowing each command to be copied independently. Native renderers can
pass command text through `tokenizeBashCommand()` and map non-plain tokens to `.cf-syntax-token`
elements with the returned `data-token` value. The tokenizer preserves the original text exactly.

## Tables

Wrap `.cf-table` in a labelled, keyboard-focusable `.cf-table-container` to provide responsive
horizontal scrolling. Tables have an explicit semantic surface in both themes and support compact
cell spacing through `data-density="compact"` and alternating rows through `data-striped="true"`.
Column headers use the dark `data-header-tone="strong"` presentation by default; choose `muted` for
a quieter surface. Set `--cf-table-min-width` on the container when the content needs a wider
responsive threshold.

## Accessibility

The stylesheet preserves visible focus, reduced-motion preferences, semantic
contrast in both themes, and forced-colors borders. Controllers complement
native semantics; they do not replace required labels, accessible names,
heading structure, or correct roles in application markup.

Manrope is bundled locally and remains licensed under the SIL Open Font
License 1.1; see `LICENSES/OFL-1.1.txt`.
