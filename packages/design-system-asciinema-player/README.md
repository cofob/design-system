# @cofob/design-system-asciinema-player

SSR-safe Native, React, and Svelte 5 adapters for
[`asciinema-player`](https://github.com/asciinema/asciinema-player), styled with the cofob design system.

## Install and styles

Install this package together with the adapter used by your application. Consumers load CSS explicitly:

```js
import "@cofob/design-system-css/index.css";
import "@cofob/design-system-asciinema-player/styles.css";
```

The player defaults to a token-driven `cofob` terminal theme. Pass another upstream `theme` through `options`
to use it instead. Recordings are not preloaded unless `options.preload` is enabled.

## React

```tsx
import { AsciinemaPlayer } from "@cofob/design-system-asciinema-player/react";

<AsciinemaPlayer
  source="/recordings/demo.cast"
  label="Deployment walkthrough"
  fallbackHref="/recordings/demo"
  options={{ cols: 100, fit: "width" }}
  onPlayerReady={(player) => player.seek("25%")}
/>;
```

## Svelte

```svelte
<script lang="ts">
  import { AsciinemaPlayer } from "@cofob/design-system-asciinema-player/svelte";
  import type { Player } from "@cofob/design-system-asciinema-player";

  let player: Player | undefined = $state();
</script>

<AsciinemaPlayer
  source="/recordings/demo.cast"
  label="Deployment walkthrough"
  fallbackHref="/recordings/demo"
  bind:player
/>
```

## Native HTML

The controller expects the documented data-attribute shell. It dynamically imports the browser player and returns
a deterministic `destroy()` method.

```html
<figure
  class="cf-asciinema-player"
  data-cf-asciinema-player
  data-state="loading"
  aria-label="Deployment walkthrough"
  aria-busy="true"
>
  <div class="cf-stack" data-gap="sm" data-align="stretch">
    <div
      class="cf-card cf-asciinema-player__stage"
      data-padding="none"
      data-variant="default"
      data-cf-asciinema-player-stage
      hidden
    >
      <div data-cf-asciinema-player-mount></div>
    </div>
    <div
      class="cf-alert cf-asciinema-player__fallback"
      data-tone="info"
      role="status"
      data-cf-asciinema-player-fallback
    >
      <div class="cf-alert__content">
        <div class="cf-alert__title" data-cf-asciinema-player-fallback-title>Terminal recording</div>
        <div class="cf-alert__description">
          <a class="cf-link" data-cf-asciinema-player-fallback-link href="/recordings/demo">
            Open recording
          </a>
        </div>
      </div>
    </div>
  </div>
</figure>

<script type="module">
  import { createAsciinemaPlayerController } from "@cofob/design-system-asciinema-player";

  const root = document.querySelector("[data-cf-asciinema-player]");
  const controller = createAsciinemaPlayerController(root, {
    source: "/recordings/demo.cast",
    fallbackHref: "/recordings/demo",
  });

  addEventListener("pagehide", () => controller.destroy(), { once: true });
</script>
```

## Lifecycle and fallback behavior

`controller.ready` and `onPlayerReady` indicate that the upstream UI was created; recording fetching may still be
in progress. Import or creation failures change the shell to `data-state="error"` and call
`onPlayerLoadError`. Fetch and parser failures after creation remain in asciinema-player's own error overlay.

React and Svelte destroy and recreate the player when the `source` or `options` object identity changes. Memoize a
React options object when it should remain stable. No fallback URL is inferred, so applications can enforce their
own source validation and player-page routes.

## License

The wrapper code uses the repository license in `LICENSE`. The bundled upstream stylesheet and runtime dependency
are Apache-2.0 licensed; see `THIRD_PARTY_NOTICES.md` and `LICENSES/asciinema-player-Apache-2.0.txt`.
