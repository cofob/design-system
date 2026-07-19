<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Tone } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
    title?: string;
    tone?: Tone;
    dismissible?: boolean;
    dismissLabel?: string;
    icon?: Snippet;
    children?: Snippet;
    onDismiss?: () => void;
  }

  let {
    title,
    tone = "info",
    dismissible = false,
    dismissLabel = "Dismiss",
    icon,
    children,
    onDismiss,
    class: className,
    ...rest
  }: Props = $props();

  let visible = $state(true);
</script>

{#if visible}
  <div
    class={cx("cf-alert", className)}
    data-tone={tone}
    role={tone === "danger" ? "alert" : "status"}
    {...rest}
  >
    {#if icon}<span class="cf-alert__icon">{@render icon()}</span>{/if}
    <div class="cf-alert__content">
      {#if title}<p class="cf-alert__title">{title}</p>{/if}
      <div class="cf-alert__description">{@render children?.()}</div>
    </div>
    {#if dismissible}
      <button
        type="button"
        class="cf-alert__dismiss"
        aria-label={dismissLabel}
        onclick={() => {
          visible = false;
          onDismiss?.();
        }}><span aria-hidden="true">×</span></button
      >
    {/if}
  </div>
{/if}
