---
"@cofob/design-system-css": minor
"@cofob/design-system-react": minor
"@cofob/design-system-svelte": minor
---

Pause animated sticker video playback while the sticker is outside the viewport and resume it when the sticker becomes visible again. Remove the inline first-frame skeleton from the DOM after playback starts, restoring it for fallback states and controller cleanup. Add a global `data-cf-animated-stickers` flag, imperative helpers, and Native/React/Svelte `AnimatedStickerToggle` components that unload every WebM while leaving static SVG/WebP stickers available.
