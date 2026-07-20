# cofob Design System

The shared design language and component system for cofob.dev sites. It keeps the original site's content-first typography, sky accent, zinc surfaces, soft geometry, and direct interactions while making those decisions reusable across standards-based HTML, React, and Svelte.

The system uses authored semantic CSS rather than utility generation or CSS-in-JS. React and Svelte render the same public `cf-*` class and `data-*` state contract provided by the CSS package.

## Packages

| Package                         | Purpose                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@cofob/design-system-assets`   | Node-only Telegram TGS conversion to transparent WebM and an inline SVG manifest                         |
| `@cofob/design-system-stickers` | Optimized Telegram sticker assets with sharded catalogs and generated React/Svelte components            |
| `@cofob/design-system-css`      | Semantic tokens, light/dark themes, Manrope, base/component CSS, PostCSS source, and vanilla controllers |
| `@cofob/design-system-react`    | Typed React 18.3/19 components                                                                           |
| `@cofob/design-system-svelte`   | Svelte 5 components compatible with SvelteKit 2                                                          |
| `@cofob/design-system-showroom` | Private Astro application deployed to [design.cofob.dev](https://design.cofob.dev)                       |

The three UI packages share a fixed Changesets version. The two asset packages are versioned independently. All public packages are published to GitHub Packages.

## Requirements

- Node.js 24.11 or newer
- npm 11
- FFmpeg with `libvpx-vp9` when converting Telegram `.tgs` stickers
- A classic GitHub token with `read:packages` for installing from GitHub Packages

Configure the `@cofob` scope without committing a token:

```ini
@cofob:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

## Install

Native HTML, CSS, and optional vanilla controllers:

```sh
npm install @cofob/design-system-css lucide
```

React:

```sh
npm install @cofob/design-system-css @cofob/design-system-react lucide-react
```

Svelte or SvelteKit:

```sh
npm install @cofob/design-system-css @cofob/design-system-svelte @lucide/svelte
```

Build-time TGS conversion:

```sh
npm install --save-dev @cofob/design-system-assets
cf-tgs convert sticker.tgs --out-dir public/stickers/example --public-base /stickers/example
```

Reusable sticker packs and generated framework components:

```sh
npm install @cofob/design-system-stickers
cf-stickers copy --out-dir public/stickers
```

Import the complete stylesheet once at the application root:

```ts
import "@cofob/design-system-css/index.css";
```

The CSS package also exposes granular `tokens.css`, `fonts.css`, `base.css`, `components.css`, and PostCSS authoring entries. Framework packages never inject styles.

## Development

```sh
npm install
npm run build
npm run dev
```

Validation commands:

```sh
npm run check
npm run lint
npm run format:check
npm run test:e2e
npm run test:a11y
npm run test:visual
```

`npm run check` validates type/build contracts, the complete showroom manifest, tests, package contents, and repository-wide styling boundaries.

## Repository layout

```text
packages/
  design-system-assets/    build-time TGS conversion and manifest generation
  design-system-stickers/  optimized packs, sharded catalogs, and generated adapters
  design-system-css/       tokens, CSS, public contracts, vanilla controllers
  design-system-react/     React adapter
  design-system-svelte/    Svelte 5 adapter
apps/
  showroom/                Astro documentation and live examples
tests/e2e/                 cross-adapter accessibility and interaction checks
```

See [Design language](docs/DESIGN_LANGUAGE.md), [cofob.dev migration](docs/MIGRATION.md), and [release/deployment operations](docs/OPERATIONS.md).

## License

Original work is covered by the repository [cofob.dev License](LICENSE). Manrope and other third-party dependencies retain their own licenses; package notices are shipped with the relevant artifacts.
