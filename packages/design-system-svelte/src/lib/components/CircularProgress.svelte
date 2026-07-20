<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    value: number;
    max?: number;
    label: string;
    size?: Size;
    animated?: boolean;
    showValue?: boolean;
    formatValue?: (percentage: number, value: number, max: number) => string;
  }

  let {
    value,
    max = 100,
    label,
    size = "md",
    animated = false,
    showValue = true,
    formatValue = (percentage) => `${percentage}%`,
    class: className,
    "aria-label": ariaLabel,
    ...rest
  }: Props = $props();

  const resolvedMax = $derived(Number.isFinite(max) && max > 0 ? max : 100);
  const resolvedValue = $derived(Math.min(resolvedMax, Math.max(0, Number.isFinite(value) ? value : 0)));
  const percentage = $derived(Math.round((resolvedValue / resolvedMax) * 100));
</script>

<span
  class={cx("cf-circular-progress", className)}
  data-size={size}
  data-animated={animated || undefined}
  role="progressbar"
  aria-label={ariaLabel ?? label}
  aria-valuemin="0"
  aria-valuemax={resolvedMax}
  aria-valuenow={resolvedValue}
  {...rest}
>
  <svg class="cf-circular-progress__graphic" viewBox="0 0 44 44" aria-hidden="true">
    <circle class="cf-circular-progress__track" cx="22" cy="22" r="18"></circle>
    <circle
      class="cf-circular-progress__indicator"
      cx="22"
      cy="22"
      r="18"
      pathLength="100"
      stroke-dasharray="100"
      stroke-dashoffset={100 - percentage}
    ></circle>
  </svg>
  {#if showValue}<span class="cf-circular-progress__value"
      >{formatValue(percentage, resolvedValue, resolvedMax)}</span
    >{/if}
</span>
