<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    label?: string;
    forId?: string;
    description?: string;
    error?: string;
    required?: boolean;
    children?: Snippet;
  }

  let {
    label,
    forId,
    description,
    error,
    required = false,
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<div class={cx("cf-field", className)} data-invalid={Boolean(error) || undefined} {...rest}>
  {#if label}
    <label class="cf-field__label" for={forId}>
      {label}{#if required}<span class="cf-field__required" aria-hidden="true">*</span>{/if}
    </label>
  {/if}
  {@render children?.()}
  {#if error}<p class="cf-field__error" role="alert">{error}</p>{:else if description}<p
      class="cf-field__description"
    >
      {description}
    </p>{/if}
</div>
