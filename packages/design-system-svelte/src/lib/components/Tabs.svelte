<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { TabItem } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    tabs: TabItem[];
    value?: string;
    defaultValue?: string;
    orientation?: "horizontal" | "vertical";
    activationMode?: "automatic" | "manual";
    label?: string;
    children?: Snippet<[TabItem]>;
    onValueChange?: (value: string) => void;
  }

  const generatedId = $props.id();

  let {
    tabs,
    defaultValue,
    value = $bindable(defaultValue ?? tabs.find((tab) => !tab.disabled)?.id ?? ""),
    orientation = "horizontal",
    activationMode = "automatic",
    label = "Tabs",
    children,
    onValueChange,
    class: className,
    id,
    ...rest
  }: Props = $props();

  const baseId = $derived(id ?? `cf-tabs-${generatedId}`);
  const selected = $derived(
    tabs.find((tab) => tab.id === value && !tab.disabled) ?? tabs.find((tab) => !tab.disabled),
  );
  let focusedId = $state<string>();
  const tabStopId = $derived(
    tabs.some((tab) => !tab.disabled && tab.id === focusedId) ? focusedId : selected?.id,
  );
  let list: HTMLDivElement;

  const tabId = (tab: TabItem) => `${baseId}-tab-${encodeURIComponent(tab.id)}`;
  const panelId = (tab: TabItem) => `${baseId}-panel-${encodeURIComponent(tab.id)}`;

  function select(tab: TabItem) {
    if (tab.disabled) return;
    focusedId = tab.id;
    value = tab.id;
    onValueChange?.(tab.id);
  }

  function handleKeydown(event: KeyboardEvent) {
    const keys = orientation === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
    const candidates = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')];
    if (!candidates.length) return;
    const current = candidates.indexOf(document.activeElement as HTMLButtonElement);
    let next = current;
    if (event.key === keys[0]) next = current - 1;
    else if (event.key === keys[1]) next = current + 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = candidates.length - 1;
    else if (activationMode === "manual" && (event.key === "Enter" || event.key === " ")) {
      const tab = tabs.find((item) => item.id === (event.target as HTMLButtonElement).dataset.value);
      if (tab) {
        event.preventDefault();
        select(tab);
      }
      return;
    } else return;
    event.preventDefault();
    const button = candidates[(next + candidates.length) % candidates.length];
    button?.focus();
    focusedId = button?.dataset.value;
    if (activationMode === "automatic") {
      const tab = tabs.find((item) => item.id === button?.dataset.value);
      if (tab) select(tab);
    }
  }
</script>

<div
  {id}
  class={cx("cf-tabs", className)}
  data-orientation={orientation}
  data-activation-mode={activationMode}
  {...rest}
>
  <div
    bind:this={list}
    class="cf-tabs__list"
    role="tablist"
    tabindex="-1"
    aria-label={label}
    aria-orientation={orientation}
    onkeydown={handleKeydown}
  >
    {#each tabs as tab (tab.id)}
      <button
        id={tabId(tab)}
        type="button"
        class="cf-tabs__tab"
        role="tab"
        data-value={tab.id}
        data-state={tab.id === selected?.id ? "active" : "inactive"}
        aria-selected={tab.id === selected?.id}
        aria-controls={panelId(tab)}
        tabindex={tab.id === tabStopId ? 0 : -1}
        disabled={tab.disabled}
        onclick={() => select(tab)}>{tab.label}</button
      >
    {/each}
  </div>
  {#each tabs as tab (tab.id)}
    <div
      id={panelId(tab)}
      class="cf-tabs__panel"
      role="tabpanel"
      tabindex="0"
      data-value={tab.id}
      aria-labelledby={tabId(tab)}
      hidden={tab.id !== selected?.id}
    >
      {#if typeof tab.content === "string"}
        {tab.content}
      {:else if tab.content}
        {@render tab.content()}
      {:else if children}
        {@render children(tab)}
      {/if}
    </div>
  {/each}
</div>
