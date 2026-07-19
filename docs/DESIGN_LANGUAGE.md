# Design language

## Character

cofob interfaces are quiet, direct, and content first. Large Manrope headings establish identity. Zinc neutrals create structure without heavy chrome. Sky blue marks navigation, selection, focus, and the hand-drawn `BlueLine` signature.

Four principles guide decisions:

1. **Content first.** Typography, order, and whitespace establish hierarchy before decoration.
2. **Calm confidence.** Surfaces are soft and restrained; emphasis is deliberate.
3. **Platform aligned.** Semantic HTML and browser primitives are preferred to recreated behavior.
4. **Accessible by default.** Keyboard, contrast, motion preferences, and assistive technology are part of the component contract.

## Tokens

Public custom properties use `--cf-*`. Application code should consume semantic tokens such as `--cf-color-surface`, `--cf-color-text-muted`, and `--cf-color-accent` rather than zinc/sky palette steps. Components may use internal palette values only to define those semantics.

Token groups cover color, font families and type scale, spacing, radius, shadow, motion, control sizing, layout widths, and z-index. The light and dark themes replace semantic values without changing component selectors.

## Typography

Manrope is the primary family. Headings use tight leading and slightly negative tracking at large sizes; body copy keeps a relaxed line height. Muted text is supporting metadata, not a substitute for hierarchy. Long-form content uses `Prose` so headings, lists, quotes, tables, code, and media keep a consistent reading rhythm.

## Color and theme

Light mode follows the original white/zinc/sky cofob.dev palette. Dark mode uses deep zinc canvases, raised surfaces, lighter sky accents, and separately tuned feedback colors. Do not invert images or palette values. Meet WCAG 2.2 AA in both themes and never communicate state by color alone.

The theme preference is `light`, `dark`, or `system`, stored under `cf-theme`. `ThemeScript` resolves it before paint; `ThemeProvider` keeps it reactive; CSS falls back to `prefers-color-scheme` without JavaScript.

## Shape, spacing, and motion

- Controls use medium radii; content surfaces use large radii; full pills are reserved for tags, badges, avatars, and compact selection.
- Prefer `Stack`, `Inline`, `Container`, and `Section` to arbitrary margins.
- Motion explains a state change and usually lasts 150–240ms. Under reduced motion, preserve the state change and remove spatial movement.
- Focus uses a high-contrast sky outline with enough offset to remain visible against borders and dark surfaces.

## Content voice

Labels are short and literal. Links explain their destination. Alerts state what happened and what the reader can do. Empty states avoid blame and offer the next useful action. Alternative text describes the image in context; decorative duplication uses empty alt text.
