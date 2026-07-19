<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { ButtonVariant, Size, Tone } from "../types.js";

  interface Props extends Omit<HTMLButtonAttributes, "children" | "aria-label"> {
    label: string;
    variant?: ButtonVariant;
    size?: Size;
    tone?: Tone;
    loading?: boolean;
    children?: Snippet;
  }

  let {
    label,
    variant = "secondary",
    size = "md",
    tone,
    loading = false,
    children,
    disabled = false,
    type = "button",
    title,
    class: className,
    ...rest
  }: Props = $props();
</script>

<button
  {type}
  class={cx("cf-icon-button", className)}
  data-variant={variant === "secondary" ? undefined : variant}
  data-size={size}
  data-tone={tone}
  data-loading={loading || undefined}
  disabled={disabled || loading}
  aria-label={label}
  aria-busy={loading || undefined}
  title={title ?? label}
  {...rest}
>
  {#if loading}<span class="cf-button__spinner" aria-hidden="true"></span>{:else}<span
      class="cf-icon"
      aria-hidden="true">{@render children?.()}</span
    >{/if}
</button>
