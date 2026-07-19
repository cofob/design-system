<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { copyText } from "@cofob/design-system-css";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    code: string;
    language?: string;
    showLanguage?: boolean;
    copyable?: boolean;
    copyLabel?: string;
    copiedLabel?: string;
    copyErrorLabel?: string;
    copyResetAfter?: number;
  }

  let {
    code,
    language,
    showLanguage,
    copyable = true,
    copyLabel = "Copy",
    copiedLabel = "Copied",
    copyErrorLabel = "Try again",
    copyResetAfter = 1800,
    class: className,
    ...rest
  }: Props = $props();

  let copyState = $state<"idle" | "copied" | "error">("idle");
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const displaysLanguage = $derived(Boolean(language) && (showLanguage ?? true));
  const visibleLabel = $derived(
    copyState === "copied" ? copiedLabel : copyState === "error" ? copyErrorLabel : copyLabel,
  );

  async function copyCode() {
    if (resetTimer) clearTimeout(resetTimer);
    try {
      await copyText(code);
      copyState = "copied";
    } catch {
      copyState = "error";
    }
    resetTimer = setTimeout(() => (copyState = "idle"), copyResetAfter);
  }

  $effect(() => () => {
    if (resetTimer) clearTimeout(resetTimer);
  });
</script>

<div
  class={cx("cf-code-block", className)}
  data-language={language || undefined}
  data-copyable={copyable || undefined}
  data-cf-copy-scope
  {...rest}
>
  {#if displaysLanguage || copyable}
    <div class="cf-code-block__toolbar">
      {#if displaysLanguage}<span class="cf-code-block__language">{language}</span>{:else}<span></span>{/if}
      {#if copyable}
        <button
          type="button"
          class="cf-code-copy"
          data-cf-copy-button
          data-cf-copy-managed="true"
          data-copy-state={copyState}
          aria-label={copyState === "copied"
            ? "Code copied to clipboard"
            : copyState === "error"
              ? "Could not copy code. Try again"
              : `Copy${language ? ` ${language}` : ""} code`}
          onclick={copyCode}
        >
          <span data-cf-copy-label>{visibleLabel}</span>
        </button>
      {/if}
    </div>
  {/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access for horizontally scrollable code) -->
  <pre
    class="cf-code-block__pre"
    role="region"
    aria-label={language ? `${language} code` : "Code"}
    tabindex="0"><code data-cf-copy-source>{code}</code><span
      class="cf-visually-hidden"
      aria-live="polite"
      data-cf-copy-status
      >{copyState === "copied"
        ? "Copied to clipboard."
        : copyState === "error"
          ? "Could not copy to clipboard."
          : ""}</span
    ></pre>
</div>
