<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends Omit<HTMLInputAttributes, "children" | "type" | "checked" | "size"> {
    checked?: boolean;
    indeterminate?: boolean;
    label?: string;
    description?: string;
    size?: Size;
    children?: Snippet;
  }

  let {
    checked = $bindable(false),
    indeterminate = false,
    label,
    description,
    size = "md",
    children,
    class: className,
    disabled = false,
    ...rest
  }: Props = $props();

  let input: HTMLInputElement;
  $effect(() => {
    if (input) input.indeterminate = indeterminate;
  });
</script>

<label
  class={cx("cf-checkbox", className)}
  data-size={size}
  data-state={indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"}
  data-disabled={disabled || undefined}
>
  <input
    bind:this={input}
    bind:checked
    type="checkbox"
    aria-checked={indeterminate ? "mixed" : checked}
    {disabled}
    {...rest}
  />
  <span class="cf-checkbox__control" aria-hidden="true"></span>
  <span class="cf-checkbox__content">
    <span class="cf-checkbox__label"
      >{#if children}{@render children()}{:else}{label}{/if}</span
    >
    {#if description}<span class="cf-checkbox__description">{description}</span>{/if}
  </span>
</label>
