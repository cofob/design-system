<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { AccordionItem } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    items: AccordionItem[];
    value?: string[];
    defaultValue?: string[];
    multiple?: boolean;
    children?: Snippet<[AccordionItem]>;
    onValueChange?: (value: string[]) => void;
  }

  const generatedId = $props.id();

  let {
    items,
    defaultValue = [],
    value = $bindable(defaultValue),
    multiple = false,
    children,
    onValueChange,
    class: className,
    id,
    ...rest
  }: Props = $props();

  const baseId = $derived(id ?? `cf-accordion-${generatedId}`);
  let root: HTMLDivElement;

  const triggerId = (index: number) => `${baseId}-trigger-${index}`;
  const panelId = (index: number) => `${baseId}-panel-${index}`;

  function toggle(item: AccordionItem, open: boolean) {
    if (item.disabled) return;
    if (open) value = multiple ? [...new Set([...value, item.id])] : [item.id];
    else value = value.filter((entry) => entry !== item.id);
    onValueChange?.(value);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const candidates = [
      ...root.querySelectorAll<HTMLElement>('.cf-accordion__trigger:not([aria-disabled="true"])'),
    ];
    if (!candidates.length) return;
    const currentSummary = (event.target as Element).closest<HTMLElement>(".cf-accordion__trigger");
    const current = currentSummary ? candidates.indexOf(currentSummary) : -1;
    let next = current;
    if (event.key === "ArrowDown") next = current < 0 ? 0 : current + 1;
    if (event.key === "ArrowUp") next = current < 0 ? candidates.length - 1 : current - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = candidates.length - 1;
    event.preventDefault();
    candidates[(next + candidates.length) % candidates.length]?.focus();
  }
</script>

<div
  bind:this={root}
  {id}
  class={cx("cf-accordion", className)}
  data-multiple={multiple || undefined}
  {...rest}
>
  {#each items as item, index (item.id)}
    <details
      class="cf-accordion__item"
      data-state={value.includes(item.id) ? "open" : "closed"}
      data-disabled={item.disabled || undefined}
      open={value.includes(item.id)}
    >
      <summary
        id={triggerId(index)}
        class="cf-accordion__trigger"
        aria-controls={panelId(index)}
        aria-expanded={value.includes(item.id)}
        aria-disabled={item.disabled || undefined}
        tabindex={item.disabled ? -1 : 0}
        onclick={(event) => {
          event.preventDefault();
          toggle(item, !value.includes(item.id));
        }}
        onkeydown={handleKeydown}
      >
        {item.heading}<span class="cf-accordion__icon" aria-hidden="true"></span>
      </summary>
      <div id={panelId(index)} class="cf-accordion__content" role="region" aria-labelledby={triggerId(index)}>
        {#if typeof item.content === "string"}
          {item.content}
        {:else if item.content}
          {@render item.content()}
        {:else if children}
          {@render children(item)}
        {/if}
      </div>
    </details>
  {/each}
</div>
