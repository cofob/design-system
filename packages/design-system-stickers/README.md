# @cofob/design-system-stickers

Optimized 192×192 assets from selected Telegram sticker packs, plus generated React and Svelte components for every sticker. Static stickers are transparent WebP at quality 82/effort 4. Animated TGS and video stickers are transparent VP9 WebM with a safe, colored inline SVG first frame.

The Telegram packs remain third-party material. Preserve the source links from `sticker.sourceUrl` or `THIRD_PARTY_NOTICES.md` wherever the stickers are shown.

## Copy assets

Components use `/stickers` by default. Copy the published asset tree into a public directory during your build:

```sh
cf-stickers copy --out-dir public/stickers
```

Pass `assetBaseUrl` to a generated component when the copied directory is served elsewhere.

## React

```tsx
import { AnimatedChris001, PhSilver001 } from "@cofob/design-system-stickers/react";

<AnimatedChris001 alt="Chris reacting with surprise" />;
<AnimatedChris001 alt="Still first frame of Chris" playback="static" />;
<PhSilver001 alt="A silver fox reaction sticker" />;
```

For the smallest server and client graph, prefer the per-sticker subpath:

```tsx
import AnimatedChris001 from "@cofob/design-system-stickers/react/AnimatedChris001";
```

## Svelte

```svelte
<script>
  import { AnimatedChris001, PhSilver001 } from "@cofob/design-system-stickers/svelte";
</script>

<AnimatedChris001 alt="Chris reacting with surprise" />
<AnimatedChris001 alt="Still first frame of Chris" playback="static" />
<PhSilver001 alt="A silver fox reaction sticker" />
```

The equivalent isolated Svelte import is `@cofob/design-system-stickers/svelte/AnimatedChris001`.

The root entrypoint exports only the eight lightweight pack descriptors and URL helpers. It contains neither the 576-sticker catalog nor inline SVG. Load a pack catalog explicitly from a path such as `@cofob/design-system-stickers/catalogs/animated-chris`, import one full metadata object from `@cofob/design-system-stickers/stickers/animated-chris-001`, or use the raw per-sticker JSON at `@cofob/design-system-stickers/manifests/animated-chris/001`. Alternative text remains required because Telegram metadata only supplies an emoji, not an adequate accessible description.

## Regenerating

Set `TELEGRAM_BOT_TOKEN` only in the process environment and run `npm run generate --workspace @cofob/design-system-stickers`. The token is never written to disk. Generation downloads source files into an ignored cache, optimizes them, regenerates catalog/component sources, and records source attribution.
