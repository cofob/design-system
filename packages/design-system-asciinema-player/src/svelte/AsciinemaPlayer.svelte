<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  import {
    createAsciinemaPlayerController,
    resolveAsciinemaPlayerLabels,
    type AsciinemaPlayerLabels,
    type Options,
    type Player,
    type Source,
  } from "../index.js";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    source: Source;
    options?: Options;
    label?: string;
    fallbackHref?: string;
    labels?: Partial<AsciinemaPlayerLabels>;
    player?: Player | undefined;
    onPlayerReady?: (player: Player) => void;
    onPlayerLoadError?: (error: unknown) => void;
  }

  let {
    source,
    options,
    label = "Terminal recording",
    fallbackHref,
    labels: labelOverrides,
    player = $bindable(),
    onPlayerReady,
    onPlayerLoadError,
    class: className,
    ...rest
  }: Props = $props();

  let root: HTMLElement;
  let resolvedLabels = $derived(resolveAsciinemaPlayerLabels(labelOverrides));

  $effect(() => {
    const currentSource = source;
    const currentOptions = options;
    const currentFallbackHref = fallbackHref;
    const currentLabels = resolvedLabels;
    if (!root) return;

    player = undefined;
    const controller = createAsciinemaPlayerController(root, {
      source: currentSource,
      ...(currentOptions ? { options: currentOptions } : {}),
      ...(currentFallbackHref ? { fallbackHref: currentFallbackHref } : {}),
      labels: currentLabels,
      onPlayerReady: (nextPlayer) => {
        player = nextPlayer;
        onPlayerReady?.(nextPlayer);
      },
      onPlayerLoadError: (error) => onPlayerLoadError?.(error),
    });

    return () => {
      controller.destroy();
      player = undefined;
    };
  });
</script>

<figure
  {...rest}
  bind:this={root}
  class={cx("cf-asciinema-player", className)}
  aria-label={label}
  aria-busy="true"
  data-cf-asciinema-player
  data-state="loading"
>
  <div class="cf-stack" data-gap="sm" data-align="stretch" data-cf-asciinema-player-shell>
    <div
      class="cf-card cf-asciinema-player__stage"
      data-variant="default"
      data-padding="none"
      hidden
      data-cf-asciinema-player-stage
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
        <p class="cf-alert__title" data-cf-asciinema-player-fallback-title>
          {resolvedLabels.loadingTitle}
        </p>
        <div class="cf-alert__description">
          {#if fallbackHref}
            <a class="cf-link" href={fallbackHref} data-cf-asciinema-player-fallback-link>
              {resolvedLabels.fallbackLink}
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
</figure>
