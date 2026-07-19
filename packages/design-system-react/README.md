# @cofob/design-system-react

Accessible React 18.3/19 adapters for the cofob design system. The package never
injects styles; import the CSS package once at your application entry point.

```tsx
import "@cofob/design-system-css/index.css";
import { Button, ThemeProvider, ThemeScript, ThemeToggle } from "@cofob/design-system-react";
```

Render `<ThemeScript />` in the document `<head>` before visible content and wrap
the application in `<ThemeProvider>`. Theme preference is stored under
`cf-theme`, while `system` follows `prefers-color-scheme` changes.

## Entry points

- `@cofob/design-system-react` exports the complete API.
- `@cofob/design-system-react/static` contains SSR/RSC-friendly presentational
  components and `ThemeScript`.
- `@cofob/design-system-react/client` contains components that own browser state
  and is marked with `"use client"`.
- `@cofob/design-system-react/types` contains shared contracts.

All components accept native attributes, `className`, and `style`. Stateful
components accept controlled and uncontrolled pairs such as `open` /
`defaultOpen` and `value` / `defaultValue`. Import icon components from
`lucide-react` and pass them through each component's `icon`, `startIcon`, or
`endIcon` property; arbitrary React nodes are also supported where noted.

The Popover and DropdownMenu components use the platform Popover API. Their
content remains functional through the controlled `hidden` fallback in older
browsers, though native top-layer positioning and light-dismiss require Popover
API support.

`Navbar` keeps a native `details` fallback and can be configured for a tablet
breakpoint and a flush translucent menu. Call `initDesignSystem(document)` at
the application boundary to add outside-click, Escape, and link dismissal:

```tsx
<Navbar links={links} collapseAt="tablet" menuVariant="flush" surface="translucent" />
```

## Code presentation

`CodeBlock` displays a language when `language` is provided and includes clipboard feedback by
default; set `showLanguage={false}` to hide the language or `copyable={false}` to remove the copy
action. `TerminalCodeBlock` keeps command and output nodes separate, highlights commands as Bash,
and provides a copy action for every command by default. Captured output remains unhighlighted.

```tsx
<CodeBlock code={'const theme = "system";'} language="typescript" />
<TerminalCodeBlock entries={[{ command: "npm run build", output: "Build complete" }]} />
```

## Tables

`Table` keeps native table markup while adding a labelled responsive scroll container. Provide
semantic `thead`, `tbody`, row-header scopes, and cell content as children. Column headers are dark
by default; set `headerTone="muted"` for a quieter surface.

```tsx
<Table label="Package comparison" striped>
  <thead>
    <tr>
      <th scope="col">Package</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">CSS</th>
      <td>Ready</td>
    </tr>
  </tbody>
</Table>
```

## Captcha presentation

`Captcha` is an SSR-safe, controlled visual surface. Set `state` to `idle`,
`verifying`, `success`, or `error`, and connect your own verification service
through native button event props. It intentionally contains no proof-of-work,
network, worker, or token logic.

```tsx
<Captcha state={captchaState} onClick={startVerification} />
```
