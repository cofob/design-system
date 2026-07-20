<script lang="ts">
  import { onMount } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import {
    ANIMATED_STICKERS_ATTRIBUTE,
    getAnimatedStickersEnabled,
    setAnimatedStickersEnabled,
    subscribeAnimatedStickersEnabled,
  } from "@cofob/design-system-css";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends Omit<HTMLInputAttributes, "checked" | "children" | "size" | "type"> {
    enabled?: boolean;
    defaultEnabled?: boolean;
    label?: string;
    description?: string;
    size?: Size;
    onEnabledChange?: (enabled: boolean) => void;
  }

  let {
    enabled = $bindable<boolean>(),
    defaultEnabled = true,
    label = "Animated stickers",
    description,
    size = "md",
    onEnabledChange,
    class: className,
    disabled = false,
    onchange,
    ...rest
  }: Props = $props();
  let internalEnabled = $state<boolean>();
  let mounted = $state(false);
  const currentEnabled = $derived(enabled ?? internalEnabled ?? defaultEnabled);

  onMount(() => {
    mounted = true;
    const preferenceRoot = document.documentElement;
    getAnimatedStickersEnabled(preferenceRoot);
    if (enabled !== undefined || !preferenceRoot.hasAttribute(ANIMATED_STICKERS_ATTRIBUTE)) {
      setAnimatedStickersEnabled(currentEnabled, preferenceRoot);
    }
    const unsubscribe = subscribeAnimatedStickersEnabled((nextEnabled) => {
      if (enabled === undefined) internalEnabled = nextEnabled;
    }, preferenceRoot);
    return () => {
      mounted = false;
      unsubscribe();
    };
  });

  $effect(() => {
    if (mounted && enabled !== undefined) setAnimatedStickersEnabled(enabled);
  });

  function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    onchange?.(event);
    if (event.defaultPrevented) return;
    const nextEnabled = event.currentTarget.checked;
    internalEnabled = nextEnabled;
    enabled = nextEnabled;
    setAnimatedStickersEnabled(nextEnabled);
    onEnabledChange?.(nextEnabled);
  }
</script>

<label
  class={cx("cf-switch", "cf-animated-sticker-toggle", className)}
  data-cf-animated-sticker-toggle-root
  data-size={size}
  data-state={currentEnabled ? "checked" : "unchecked"}
  data-disabled={disabled || undefined}
>
  <input
    {...rest}
    class="cf-switch__control"
    type="checkbox"
    role="switch"
    checked={currentEnabled}
    {disabled}
    aria-checked={currentEnabled}
    data-cf-animated-sticker-toggle
    data-cf-animated-sticker-toggle-managed="true"
    onchange={handleChange}
  />
  <span class="cf-switch__track" aria-hidden="true"><span class="cf-switch__thumb"></span></span>
  <span class="cf-switch__content">
    <span class="cf-switch__label">{label}</span>
    {#if description}<span class="cf-switch__description">{description}</span>{/if}
  </span>
</label>
