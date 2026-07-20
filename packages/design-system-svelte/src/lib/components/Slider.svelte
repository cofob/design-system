<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLInputAttributes, "type" | "value" | "size"> {
    label: string;
    value?: number;
    defaultValue?: number;
    showValue?: boolean;
    hint?: string;
    formatValue?: (value: number) => string;
    onValueChange?: (value: number) => void;
    containerClass?: string;
  }

  let {
    label,
    defaultValue = 0,
    value = $bindable(defaultValue),
    min = 0,
    max = 100,
    step = 1,
    showValue = true,
    hint,
    formatValue = (current) => String(current),
    onValueChange,
    containerClass,
    class: className,
    id,
    name,
    onchange,
    ...rest
  }: Props = $props();

  const generatedId = $props.id();
  const inputId = $derived(id ?? `cf-slider-${generatedId}`);
  const hintId = $derived(hint ? `${inputId}-hint` : undefined);
</script>

<div class={cx("cf-slider", containerClass)}>
  <div class="cf-slider__header">
    <label class="cf-slider__label" for={inputId}>{label}</label>
    {#if showValue}<output class="cf-slider__value" for={inputId}>{formatValue(value)}</output>{/if}
  </div>
  <input
    {...rest}
    id={inputId}
    {name}
    class={cx("cf-slider__control", className)}
    type="range"
    {min}
    {max}
    {step}
    {value}
    aria-describedby={hintId}
    oninput={(event) => {
      value = event.currentTarget.valueAsNumber;
      onValueChange?.(value);
    }}
    {onchange}
  />
  {#if hint}<div class="cf-slider__hint" id={hintId}>{hint}</div>{/if}
</div>
