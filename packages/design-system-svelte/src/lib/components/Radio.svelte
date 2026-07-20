<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends Omit<HTMLInputAttributes, "children" | "type" | "checked" | "size"> {
    checked?: boolean;
    label?: string;
    description?: string | undefined;
    size?: Size;
    children?: Snippet;
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    label,
    description,
    size = "md",
    children,
    onCheckedChange,
    class: className,
    disabled = false,
    onchange,
    ...rest
  }: Props = $props();

  function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    onchange?.(event);
    if (event.defaultPrevented) return;
    checked = event.currentTarget.checked;
    onCheckedChange?.(checked);
  }
</script>

<label class={cx("cf-radio", className)} data-size={size} data-disabled={disabled || undefined}>
  <input type="radio" {checked} {disabled} onchange={handleChange} {...rest} />
  <span class="cf-radio__control" aria-hidden="true"></span>
  <span class="cf-radio__content">
    <span class="cf-radio__label"
      >{#if children}{@render children()}{:else}{label}{/if}</span
    >
    {#if description}<span class="cf-radio__description">{description}</span>{/if}
  </span>
</label>
