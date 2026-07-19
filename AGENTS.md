# cofob Design System — agent guide

These instructions apply to the entire repository. A more deeply nested `AGENTS.md`, if one is added later,
may refine them for its own directory.

## Project intent

This repository is the portable design system for cofob.dev sites. It is an npm-workspaces monorepo with a
shared CSS/controller foundation, React and Svelte adapters, consumer fixtures, and an Astro showroom.

The original site in `../cofob.dev` is a read-only visual and content reference. Never edit it while working in
this repository.

## Toolchain and workspace

- Use Node.js 24.11 or newer and npm workspaces. Do not introduce another package manager.
- Install reproducibly with `npm ci`; keep `package-lock.json` in sync with package manifests.
- Search with `rg` or `rg --files` before broader filesystem commands.
- Preserve unrelated user changes. The worktree may legitimately be dirty.
- Use `apply_patch` for deliberate source edits. Formatting tools may perform mechanical rewrites.

## Architecture and package boundaries

### `@cofob/design-system-css`

- Owns semantic `--cf-*` tokens, themes, cascade layers, public `.cf-*` classes, PostCSS sources, compiled CSS,
  portable data contracts, and vanilla ESM controllers.
- Browser globals must only be accessed inside functions or lifecycle work. Importing any public module in SSR
  must not touch `window`, `document`, `HTMLElement`, storage, or media queries.
- Controllers must return deterministic cleanup through `destroy()` and restore focus/ARIA state where relevant.
- Prefer native browser primitives such as `dialog`, popover, `details`, form controls, and semantic landmarks.

### `@cofob/design-system-react`

- Renders the shared CSS class and data-state contract; it must not ship a second styling implementation.
- Static components remain SSR/RSC-friendly. Add `"use client"` only to modules that genuinely require client
  state, effects, context, or browser interaction.
- Forward native attributes, `className`, `style`, and refs where the underlying element supports them.
- Stateful components support controlled and uncontrolled forms (`value`/`defaultValue`, `open`/`defaultOpen`)
  and report user changes through callbacks.

### `@cofob/design-system-svelte`

- Targets Svelte 5 and SvelteKit SSR, using runes and snippets rather than legacy slots.
- Renders the same semantic classes, data states, accessible names, and interaction outcomes as React and HTML.
- Bindable state and callbacks must remain predictable and must not initialize browser-only code during SSR.
- Forward native element attributes plus `class` and `style` through the component root.

### Consumer CSS

- React and Svelte packages never inject CSS automatically. Consumers explicitly import the full or granular CSS
  entry they need.
- Do not introduce utility CSS generators, CSS-in-JS, framework-specific style copies, or hard-coded theme colors.
- Use semantic tokens for color, spacing, type, radii, shadows, z-index, and motion.

## Public component work

When adding or changing a public component:

1. Implement or update the shared CSS contract first.
2. Keep HTML/controller, React, and Svelte behavior and visible fixtures equivalent.
3. Export public runtime APIs and types from the appropriate package entrypoints.
4. Add the component to `apps/showroom/src/data/components.json`.
5. Document every parameter and all three adapter examples in
   `apps/showroom/src/data/component-contracts.ts`.
6. Add equivalent fixtures to `NativePreview.astro`, `ReactComponentPreview.tsx`, and
   `SvelteComponentPreview.svelte`.
7. Cover behavior, accessibility, package exports, and visual changes at the appropriate test layer.

Composition should be idiomatic: React uses `children`/React nodes, Svelte uses snippets, and HTML uses semantic
children and data attributes. Router-specific imports do not belong in portable components.

## Accessibility and interaction

- Preserve WCAG 2.2 AA contrast in light and dark themes.
- Every interactive state must be reachable and understandable by keyboard and assistive technology.
- Keep focus visible, return focus after transient surfaces close, and maintain logical focus order.
- Respect `prefers-reduced-motion` and forced-colors. Motion must explain state without being required to perceive
  it.
- Keep accessible names, descriptions, ARIA relationships, live-region behavior, and disabled semantics aligned
  across all adapters.
- Menus and tabs retain arrow/Home/End/typeahead behavior. Dialog, popover, tooltip, toast, and accordion behavior
  must match their documented platform/controller contracts.

## Theme contract

- Theme preference is `light | dark | system`, stored under `cf-theme` unless explicitly configured otherwise.
- The resolved theme is reflected through `data-theme` on `<html>`.
- Keep the synchronous before-paint script and runtime provider in agreement to avoid theme flashes.
- Do not read storage or system preference during module evaluation. Storage denial must fail safely.

## Showroom and documentation

- The showroom is a static Astro application and simultaneously demonstrates Native, React, and Svelte.
- English is the documentation language unless the user explicitly requests another language for a page.
- Keep component navigation, completeness checks, detail pages, and previews driven by the shared manifest.
- Each component page must contain copyable React, Svelte, and HTML examples plus complete parameter documentation.
- Examples should use identical content and states across adapters so visual differences indicate a real regression.
- Do not remove visual snapshot baselines merely to make tests pass; inspect the change and update snapshots only
  when the new rendering is intentional.

## Required checks

Use the smallest relevant checks while iterating, then run broader validation before handing off meaningful work.

```sh
npm run format:check
npm run lint
npm run check:manifest
npm run check:docs
npm run check:public-api
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
npm run test:a11y
npm run test:visual
npm run check:packages
```

- Interaction changes require targeted Playwright keyboard tests for Native, React, and Svelte.
- Layout, theme, or component rendering changes require desktop/mobile and light/dark visual review.
- Package changes require `publint`, type-export validation, and archive-content checks through
  `npm run check:packages`.
- Documentation/manifest work must keep `scripts/check-component-manifest.mjs`,
  `scripts/check-component-docs.mjs`, and `scripts/check-public-api.mjs` green.

## Releases and deployment

- The three public packages are a fixed Changesets group and must be versioned together.
- Add a changeset for publishable user-facing changes; do not edit package versions by hand.
- Packages publish to GitHub Packages under the `@cofob` scope.
- The showroom deploys to Cloudflare Pages project `cofob-design-system`; `main` is production and pull requests
  use branch previews.
- Never print or commit access tokens, Wrangler credentials, package registry credentials, or environment files.
- External deploys, domain changes, releases, and repository writes require explicit user authorization.

## Git hygiene

- Source, licenses, documentation, public assets, package manifests, lockfiles, tests, and intentional Playwright
  snapshots belong in version control.
- Generated output and local state do not: `dist`, `build`, `.astro`, `.svelte-kit`, `.vite`, `.wrangler`, coverage,
  reports, caches, logs, `*.tsbuildinfo`, package archives, and environment files.
- Do not disable commit signing. If a normal signed commit fails because the SSH agent is unavailable, retry with
  `probe-ssh git air-commit ...` as described by the global agent instructions.
- Never use destructive git commands to discard user work. Do not stage, commit, push, or publish unless the user
  requests that action.

## Licensing

Repository code and original documentation use the root project license. Preserve third-party notices, Manrope's
OFL attribution, and the Cap reference notice. Do not copy third-party implementation code when only visual or
behavioral reference is authorized.
