<script lang="ts">
  import type { HTMLProgressAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLProgressAttributes, "value"> {
    value?: number;
    label?: string;
    valueLabel?: string;
    animated?: boolean;
    showValue?: boolean;
  }

  let {
    value,
    max = 100,
    label,
    valueLabel,
    animated = false,
    showValue = true,
    class: className,
    id,
    ...rest
  }: Props = $props();
  const generatedId = $props.id();
  const progressId = $derived(id ?? `cf-progress-${generatedId}`);
  const automaticLabel = $derived(
    value === undefined ? "In progress" : `${Math.round((value / Number(max || 100)) * 100)}%`,
  );
</script>

<div
  class={cx("cf-progress", className)}
  data-state={value === undefined ? "indeterminate" : "determinate"}
  data-animated={animated || undefined}
>
  {#if label || showValue}
    <div class="cf-progress__header">
      {#if label}<label class="cf-progress__label" for={progressId}>{label}</label>{:else}<span></span>{/if}
      {#if showValue}<span class="cf-progress__value">{valueLabel ?? automaticLabel}</span>{/if}
    </div>
  {/if}
  <progress class="cf-progress__track" id={progressId} {value} {max} {...rest}>{automaticLabel}</progress>
</div>
