<script lang="ts">
  import { onMount, setContext } from "svelte";
  import type { Snippet } from "svelte";
  import { applyTheme, THEME_CONTEXT, type ThemeContext } from "../theme-context.js";
  import type { ThemePreference } from "../types.js";

  interface Props {
    preference?: ThemePreference;
    defaultPreference?: ThemePreference;
    storageKey?: string;
    children?: Snippet;
    onPreferenceChange?: (preference: ThemePreference) => void;
  }

  let {
    preference = $bindable<ThemePreference | undefined>(undefined),
    defaultPreference = "system",
    storageKey = "cf-theme",
    children,
    onPreferenceChange,
  }: Props = $props();

  let internalPreference = $state<ThemePreference>();
  let mounted = $state(false);
  const current = $derived(preference ?? internalPreference ?? defaultPreference);

  const context: ThemeContext = {
    get preference() {
      return current;
    },
    setPreference(next) {
      internalPreference = next;
      preference = next;
      onPreferenceChange?.(next);
    },
  };

  setContext(THEME_CONTEXT, context);

  onMount(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (preference === undefined && (stored === "light" || stored === "dark" || stored === "system")) {
        internalPreference = stored;
      }
    } catch {
      // Storage can be unavailable in hardened browsing contexts.
    }

    mounted = true;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      if (current === "system") applyTheme(current);
    };
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  });

  $effect(() => {
    if (!mounted) return;
    applyTheme(current);
    try {
      localStorage.setItem(storageKey, current);
    } catch {
      // Keep theme switching functional when persistence is blocked.
    }
  });
</script>

{@render children?.()}
