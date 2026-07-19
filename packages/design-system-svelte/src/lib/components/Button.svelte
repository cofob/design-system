<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { ButtonVariant, Size, Tone } from "../types.js";

  interface Props extends Omit<HTMLButtonAttributes, "children"> {
    variant?: ButtonVariant;
    size?: Size;
    tone?: Tone;
    loading?: boolean;
    fullWidth?: boolean;
    children?: Snippet;
    leading?: Snippet;
    trailing?: Snippet;
  }

  let {
    variant = "primary",
    size = "md",
    tone,
    loading = false,
    fullWidth = false,
    children,
    leading,
    trailing,
    disabled = false,
    type = "button",
    class: className,
    ...rest
  }: Props = $props();
</script>

<button
  {type}
  class={cx("cf-button", className)}
  data-variant={variant}
  data-size={size}
  data-tone={variant === "danger" ? "danger" : tone}
  data-loading={loading || undefined}
  data-full-width={fullWidth || undefined}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span class="cf-button__spinner" aria-hidden="true"
    ></span>{:else if leading}{@render leading()}{/if}
  <span class="cf-button__label">{@render children?.()}</span>
  {#if !loading && trailing}{@render trailing()}{/if}
</button>
