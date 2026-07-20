# @cofob/design-system-css

## 0.3.0

### Minor Changes

- 9440e47: Pause animated sticker video playback while the sticker is outside the viewport and resume it when the sticker becomes visible again. Remove the inline first-frame skeleton from the DOM after playback starts, restoring it for fallback states and controller cleanup. Add a global `data-cf-animated-stickers` flag, imperative helpers, and Native/React/Svelte `AnimatedStickerToggle` components that unload every WebM while leaving static SVG/WebP stickers available.

## 0.2.0

### Minor Changes

- 7b0356c: Add the cross-adapter AnimatedSticker component with an inline first-frame SVG fallback, reduced-motion handling, lazy WebM loading, a static first-frame mode, and native controller support. Introduce the independently versioned sticker asset package with optimized media, sharded catalogs, and generated React/Svelte components.

## 0.1.1

### Patch Changes

- d0ac55e: Add the application shell, avatar, inline emoji, and media grid contracts required by cofob.dev; render published and updated post dates and highlighted search tags; and preserve linked chat messages consistently across HTML, React, and Svelte.
