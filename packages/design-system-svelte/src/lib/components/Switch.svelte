<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends Omit<HTMLInputAttributes, "children" | "type" | "checked" | "size"> {
    checked?: boolean;
    label?: string;
    description?: string;
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
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...rest
  }: Props = $props();

  const generatedId = $props.id();
  const labelId = `${generatedId}-label`;

  function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    checked = event.currentTarget.checked;
    onchange?.(event);
    onCheckedChange?.(checked);
  }
</script>

<label
  class={cx("cf-switch", className)}
  data-size={size}
  data-state={checked ? "checked" : "unchecked"}
  data-disabled={disabled || undefined}
>
  <input
    bind:checked
    class="cf-switch__control"
    type="checkbox"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby ?? (label || children ? labelId : undefined)}
    {disabled}
    onchange={handleChange}
    {...rest}
  />
  <span class="cf-switch__track" aria-hidden="true"><span class="cf-switch__thumb"></span></span>
  {#if label || children || description}
    <span class="cf-switch__content">
      <span class="cf-switch__label" id={labelId}
        >{#if children}{@render children()}{:else}{label}{/if}</span
      >
      {#if description}<span class="cf-switch__description">{description}</span>{/if}
    </span>
  {/if}
</label>
