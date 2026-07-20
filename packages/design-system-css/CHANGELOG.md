# @cofob/design-system-css

## 0.5.0

### Minor Changes

- 9de57cd: Render ANSI colors, text styles, and safe OSC 8 hyperlinks in terminal output across native, React, and Svelte presentations.
- 3da25bd: Add radio groups, breadcrumbs, configurable linear and circular progress indicators, spinners, pulsing skeletons, separators, comboboxes, drawers, file uploads, sliders, steppers, and themed audio and video players across the CSS, React, and Svelte packages.

## 0.4.1

### Patch Changes

- 75df12b: Reduce vertical padding across all alert tones while preserving their horizontal inset.

## 0.4.0

### Minor Changes

- fa162ed: Persist the global animated-sticker preference across page reloads. Support optimized WebP first frames for video-based stickers while retaining trusted inline SVG first frames for vector TGS animations.

### Patch Changes

- ed47d11: Keep `ResponsiveImage` visible in dark themes when no `darkImage` artwork is provided, and visually group
  consecutive `ChatThread` messages from the same sender while preserving per-message timestamps and accessible
  sender context. Make the entire `LatestPostCard` an accessible link and remove borders from avatar surfaces.
  Make `PostCard` and `SearchResultCard` single accessible links so their complete surfaces navigate to the post.
  Keep `Footer` content inset from viewport edges on narrow screens.
  Add explicit narrow, default, and full width choices to `Prose` for responsive article layouts.
  Reduce large `Section` spacing at tablet widths so collapsed navigation stays close to page content.

## 0.3.0

### Minor Changes

- 9440e47: Pause animated sticker video playback while the sticker is outside the viewport and resume it when the sticker becomes visible again. Remove the inline first-frame skeleton from the DOM after playback starts, restoring it for fallback states and controller cleanup. Add a global `data-cf-animated-stickers` flag, imperative helpers, and Native/React/Svelte `AnimatedStickerToggle` components that unload every WebM while leaving static SVG/WebP stickers available.

## 0.2.0

### Minor Changes

- 7b0356c: Add the cross-adapter AnimatedSticker component with an inline first-frame SVG fallback, reduced-motion handling, lazy WebM loading, a static first-frame mode, and native controller support. Introduce the independently versioned sticker asset package with optimized media, sharded catalogs, and generated React/Svelte components.

## 0.1.1

### Patch Changes

- d0ac55e: Add the application shell, avatar, inline emoji, and media grid contracts required by cofob.dev; render published and updated post dates and highlighted search tags; and preserve linked chat messages consistently across HTML, React, and Svelte.
