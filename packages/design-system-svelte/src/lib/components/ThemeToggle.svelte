<script lang="ts">
  import { getContext } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import { THEME_CONTEXT, type ThemeContext } from "../theme-context.js";
  import type { ThemePreference } from "../types.js";

  interface Props extends HTMLButtonAttributes {
    preference?: ThemePreference;
    cycle?: readonly ThemePreference[];
    labels?: Partial<Record<ThemePreference, string>>;
    showLabel?: boolean;
    onPreferenceChange?: (preference: ThemePreference) => void;
  }

  let {
    preference = $bindable<ThemePreference>(),
    cycle = ["system", "light", "dark"],
    labels = { system: "System theme", light: "Light theme", dark: "Dark theme" },
    showLabel = true,
    onPreferenceChange,
    class: className,
    onclick,
    ...rest
  }: Props = $props();

  const context = getContext<ThemeContext | undefined>(THEME_CONTEXT);
  const current = $derived(preference ?? context?.preference ?? "system");
  const nextPreference = $derived.by(() => {
    if (cycle.length === 0) return "system";
    const index = Math.max(0, cycle.indexOf(current));
    return cycle[(index + 1) % cycle.length] ?? "system";
  });

  function cycleTheme(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    onclick?.(event);
    if (event.defaultPrevented) return;
    const next: ThemePreference = nextPreference;
    preference = next;
    context?.setPreference(next);
    onPreferenceChange?.(next);
  }
</script>

<button
  type="button"
  class={cx("cf-theme-toggle", className)}
  data-preference={current}
  aria-label={`${labels[current] ?? current}. Switch to ${labels[nextPreference] ?? nextPreference}.`}
  title={labels[current] ?? current}
  onclick={cycleTheme}
  {...rest}
>
  <span class="cf-theme-toggle__icon" aria-hidden="true" data-cf-theme-icon></span>
  {#if showLabel}
    <span
      class="cf-theme-toggle__label"
      aria-hidden="true"
      data-cf-theme-label
      data-label-system={labels.system ?? "System theme"}
      data-label-light={labels.light ?? "Light theme"}
      data-label-dark={labels.dark ?? "Dark theme"}
    ></span>
  {/if}
</button>
