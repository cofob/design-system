<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { copyText, tokenizeBashCommand } from "@cofob/design-system-css";
  import type { TerminalCodeEntry } from "@cofob/design-system-css";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    entries: readonly TerminalCodeEntry[];
    label?: string;
    prompt?: string;
    copyable?: boolean;
    copyLabel?: string;
    copiedLabel?: string;
    copyErrorLabel?: string;
    copyResetAfter?: number;
    outputLabel?: string;
  }

  let {
    entries,
    label = "Terminal",
    prompt = "$",
    copyable = true,
    copyLabel = "Copy command",
    copiedLabel = "Copied",
    copyErrorLabel = "Try again",
    copyResetAfter = 1800,
    outputLabel = "Command output",
    class: className,
    ...rest
  }: Props = $props();

  let copyStates = $state<Record<number, "copied" | "error">>({});
  const resetTimers = new Map<number, ReturnType<typeof setTimeout>>();

  async function copyCommand(index: number, command: string) {
    const activeTimer = resetTimers.get(index);
    if (activeTimer) clearTimeout(activeTimer);
    try {
      await copyText(command);
      copyStates[index] = "copied";
    } catch {
      copyStates[index] = "error";
    }
    resetTimers.set(
      index,
      setTimeout(() => {
        delete copyStates[index];
        resetTimers.delete(index);
      }, copyResetAfter),
    );
  }

  $effect(() => () => {
    for (const timer of resetTimers.values()) clearTimeout(timer);
    resetTimers.clear();
  });
</script>

<div class={cx("cf-terminal-code-block", className)} role="region" aria-label={label} {...rest}>
  <div class="cf-terminal-code-block__toolbar">
    <span class="cf-terminal-code-block__label">{label}</span>
  </div>
  <div class="cf-terminal-code-block__entries">
    {#each entries as entry, index (`${entry.command}:${index}`)}
      {@const state = copyStates[index] ?? "idle"}
      {@const commandTokens = tokenizeBashCommand(entry.command)}
      <div class="cf-terminal-code-block__entry" data-cf-copy-scope>
        <div class="cf-terminal-code-block__command-row">
          <span class="cf-terminal-code-block__prompt" aria-hidden="true">{prompt}</span>
          <pre class="cf-terminal-code-block__command"><code data-cf-copy-source data-language="bash"
              >{#each commandTokens as token}{#if token.kind === "plain"}{token.value}{:else}<span
                    class="cf-syntax-token"
                    data-token={token.kind}>{token.value}</span
                  >{/if}{/each}</code
            ></pre>
          {#if copyable}
            <button
              type="button"
              class="cf-code-copy"
              data-cf-copy-button
              data-cf-copy-managed="true"
              data-copy-state={state}
              aria-label={state === "copied"
                ? `Command ${index + 1} copied to clipboard`
                : state === "error"
                  ? `Could not copy command ${index + 1}. Try again`
                  : `Copy command ${index + 1}`}
              onclick={() => copyCommand(index, entry.command)}
            >
              <span data-cf-copy-label
                >{state === "copied" ? copiedLabel : state === "error" ? copyErrorLabel : copyLabel}</span
              >
            </button>
          {/if}
        </div>
        {#if entry.output !== undefined}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access for horizontally scrollable output) -->
          <pre
            class="cf-terminal-code-block__output"
            role="region"
            tabindex="0"
            aria-label={`${outputLabel} ${index + 1}`}><code>{entry.output}</code></pre>
        {/if}
        <span class="cf-visually-hidden" aria-live="polite" data-cf-copy-status
          >{state === "copied"
            ? "Copied to clipboard."
            : state === "error"
              ? "Could not copy to clipboard."
              : ""}</span
        >
      </div>
    {/each}
  </div>
</div>
