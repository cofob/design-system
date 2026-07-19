<script lang="ts">
  import { createTooltipController } from "@cofob/design-system-css";
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "content"> {
    content: string;
    placement?: "top" | "right" | "bottom" | "left";
    delay?: number;
    children?: Snippet;
  }

  const generatedId = $props.id();

  let { content, placement = "top", delay = 1000, children, class: className, id, ...rest }: Props = $props();

  const tooltipId = $derived(id ?? `cf-tooltip-${generatedId}`);
  let anchor: HTMLSpanElement;
  let surface: HTMLSpanElement;

  onMount(() => {
    const trigger =
      anchor.querySelector<HTMLElement>(
        'a[href], button, input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      ) ?? anchor;
    const controller = createTooltipController(surface, { triggers: trigger, delay, placement });
    return () => controller.destroy();
  });
</script>

<span class="cf-tooltip-root">
  <span bind:this={anchor} class="cf-tooltip__trigger" aria-describedby={tooltipId}
    >{@render children?.()}</span
  >
  <span
    bind:this={surface}
    id={tooltipId}
    class={cx("cf-tooltip", className)}
    role="tooltip"
    popover="manual"
    data-state="closed"
    data-placement={placement}
    {...rest}>{content}</span
  >
</span>
