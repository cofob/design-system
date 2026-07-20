# @cofob/design-system-assets

Build-time converters for assets consumed by the cofob design system.

## Telegram TGS stickers

The package converts a Telegram `.tgs` sticker into a transparent VP9 WebM and a JSON manifest. The manifest embeds a sanitized SVG rendering of the first animation frame, so `AnimatedSticker` can server-render its loading skeleton directly into the page without a second request.

FFmpeg with the `libvpx-vp9` encoder must be available on `PATH`, or passed explicitly with `--ffmpeg-path`.

```sh
cf-tgs convert sticker.tgs \
  --out-dir public/stickers/example \
  --public-base /stickers/example
```

```ts
import { convertTgs } from "@cofob/design-system-assets";

const manifest = await convertTgs({
  input: "sticker.tgs",
  outputDir: "public/stickers/example",
  publicBase: "/stickers/example",
});
```

Pass `--size 192` (or `size: 192` to `convertTgs`) for the compact 192×192 sticker pipeline used by cofob.dev. The default remains Telegram's native 512×512 composition size.

Current Telegram validation remains strict at 60 fps. An archival pipeline that must preserve an older 30 fps Telegram pack can opt in with `allowLegacyFps: true`.

Only pass `manifest.sticker.skeletonSvg` to a component that explicitly treats it as trusted markup. The converter removes scripts, event handlers, foreign content, images, and external references before returning the SVG.
