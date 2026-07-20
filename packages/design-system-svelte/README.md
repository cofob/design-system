# @cofob/design-system-svelte

Svelte 5 and SvelteKit components for the cofob design system. Components emit
semantic HTML and `cf-*` class names; styles are deliberately not injected.

```sh
npm install @cofob/design-system-svelte @cofob/design-system-css @lucide/svelte
```

```svelte
<script lang="ts">
  import { Button, ThemeProvider, ThemeToggle } from "@cofob/design-system-svelte";
  import "@cofob/design-system-css/index.css";
</script>

<ThemeProvider>
  <ThemeToggle />
  <Button tone="accent">Continue</Button>
</ThemeProvider>
```

Interactive values are bindable where appropriate (`bind:open`, `bind:value`,
and `bind:preference`). Components do not access browser globals during module
evaluation and are safe to import during SvelteKit SSR.

`ThemeProvider` treats `preference` as the explicit controlled value and only
restores `cf-theme` from storage when it is omitted. Use `defaultPreference` to
choose the uncontrolled fallback. Portable link, image, post, and chat model
types are re-exported from `@cofob/design-system-css`; Svelte-only content
overrides continue to accept snippets.

`Navbar` uses the shared controller internally and supports the same responsive
presentation as the native and React adapters:

```svelte
<Navbar {links} collapseAt="tablet" menuVariant="flush" surface="translucent" bind:open />
```

## Code presentation

`CodeBlock` displays a language when `language` is provided and includes clipboard feedback by
default; use `showLanguage={false}` to hide the language or `copyable={false}` to remove the copy
action. `TerminalCodeBlock` keeps commands and output separate and makes every command copyable by
default. Commands receive Bash syntax highlighting independently from captured output.
Captured output automatically interprets ANSI standard, 256-color, truecolor, text-style, and safe
OSC 8 HTTP(S)/mail hyperlink sequences; screen controls are not emulated.

```svelte
<CodeBlock code={'const theme = "system";'} language="typescript" />
<TerminalCodeBlock entries={[{ command: "npm run build", output: "\u001b[1;32mBuild complete\u001b[0m" }]} />
```

## Tables

`Table` keeps native table markup while adding a labelled responsive scroll container. Provide
semantic `thead`, `tbody`, row-header scopes, and cell content as children. Column headers are dark
by default; set `headerTone="muted"` for a quieter surface.

```svelte
<Table label="Package comparison" striped>
  <thead><tr><th scope="col">Package</th><th scope="col">Status</th></tr></thead>
  <tbody><tr><th scope="row">CSS</th><td>Ready</td></tr></tbody>
</Table>
```

## Captcha presentation

`Captcha` is controlled through `state="idle|verifying|success|error"` and
forwards native button events. Consumers supply verification behavior; the
component includes no proof-of-work, network, worker, or token logic.

```svelte
<Captcha state={captchaState} onclick={startVerification} />
```
