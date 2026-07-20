# Migrating cofob.dev

Version 0.1.1 adds the application and publishing contracts required to migrate the neighboring `cofob.dev` repository without local presentation CSS. Migrate the consumer only after all three fixed packages are published at the same version.

1. Install the CSS and Svelte packages and import `index.css` once in the root layout.
2. Add `ThemeScript` in the document head and `ThemeProvider` around `AppShell`.
3. Replace global palette, Manrope, focus, and reduced-motion rules. Confirm light-mode visual parity first.
4. Replace `Navbar`, `Footer`, `BlueLine`, `Heading`, `Section`, and the skip link.
5. Replace search fields, buttons, tag filters, pagination, alerts, empty states, and cards.
6. Move article descendant utilities to `Prose`; use PostCard, LatestPostCard, SearchResultCard, ResponsiveImage, Avatar, InlineEmoji, MediaGrid, ChatThread, and Sticker where appropriate.
7. Remove the legacy utility pipeline only after source searches and every deployment test pass.

Application behavior stays in cofob.dev: metadata and JSON-LD, RSS/Atom portable rendering, Fediverse fetching/sanitization, blog asset processing, and Asciinema runtime. Those features compose the design system but are not public package APIs.

Representative mappings:

| Existing pattern                | Replacement                             |
| ------------------------------- | --------------------------------------- |
| `bg-white text-zinc-800`        | semantic canvas/text tokens in base.css |
| `text-sky-700 hover:underline`  | `Link` / `.cf-link`                     |
| `rounded-lg border-2 px-3 py-2` | `Button` or form-control contract       |
| `rounded-full bg-zinc-100`      | `Tag` / `Badge`                         |
| `max-w-screen-lg mx-auto`       | `Container`                             |
| flex/spacing utilities          | `Stack` and `Inline`                    |
| full-height page wrapper        | `AppShell`                              |
| sky or amber callouts           | `Alert` tones                           |
| article descendant utilities    | `Prose`                                 |

Local component replacements:

| Existing cofob.dev component         | Design-system replacement                      |
| ------------------------------------ | ---------------------------------------------- |
| `Navbar.svelte` / `Footer.svelte`    | `Navbar` / `Footer`                            |
| `Section.svelte` / `Heading.svelte`  | `Section` / `Heading`                          |
| `BlueLine.svelte`                    | `BlueLine`                                     |
| `blog/PostCard.svelte`               | `PostCard`                                     |
| `blog/LatestPostLink.svelte`         | `LatestPostCard`                               |
| `blog/ResponsiveImage.svelte`        | `ResponsiveImage`                              |
| `blog/ChatThread.svelte`             | `ChatThread`                                   |
| `blog/Sticker.svelte`                | `Sticker`                                      |
| comment avatar / initials fallback   | `Avatar`                                       |
| custom emoji image                   | `InlineEmoji`                                  |
| comment attachment layout            | `MediaGrid`                                    |
| `blog/RichText.svelte`               | `Prose`                                        |
| `blog/NoticeBlock.svelte`            | `Alert` with `info` tone                       |
| `blog/WarningBlock.svelte`           | `Alert` with `warning` tone                    |
| `CommentThread`, `Comments`, media   | Remain application-owned Fediverse composition |
| `Meta`, feed rendering, `Asciinema*` | Remain application infrastructure              |

Run the original repository's check, lint, unit, accessibility, Node smoke, static/IPFS, and Cloudflare suites before removing the legacy styling layer.
