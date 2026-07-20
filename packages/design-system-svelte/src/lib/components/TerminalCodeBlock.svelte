<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import {
    copyText,
    terminalColorToCss,
    tokenizeBashCommand,
    tokenizeTerminalOutput,
  } from "@cofob/design-system-css";
  import type { TerminalCodeEntry, TerminalOutputToken, TerminalTextStyle } from "@cofob/design-system-css";
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

  interface TerminalOutputRun {
    href?: string;
    tokens: TerminalOutputToken[];
  }

  function groupTerminalOutput(output: string): TerminalOutputRun[] {
    const runs: TerminalOutputRun[] = [];
    for (const token of tokenizeTerminalOutput(output)) {
      const previous = runs.at(-1);
      if (previous && previous.href === token.href) previous.tokens.push(token);
      else runs.push({ ...(token.href ? { href: token.href } : {}), tokens: [token] });
    }
    return runs;
  }

  function hasTerminalStyle(style: TerminalTextStyle): boolean {
    return Object.keys(style).length > 0;
  }

  function terminalTokenStyle(style: TerminalTextStyle): string | undefined {
    const properties: string[] = [];
    const decorations = [
      style.underline ? "underline" : undefined,
      style.strikethrough ? "line-through" : undefined,
      style.overline ? "overline" : undefined,
    ].filter(Boolean);
    if (style.foreground) {
      properties.push(`--cf-terminal-token-foreground:${terminalColorToCss(style.foreground)}`);
    }
    if (style.background) {
      properties.push(`--cf-terminal-token-background:${terminalColorToCss(style.background, "background")}`);
    }
    if (style.underlineColor) {
      properties.push(`--cf-terminal-token-underline:${terminalColorToCss(style.underlineColor)}`);
    }
    if (decorations.length) {
      properties.push(`--cf-terminal-token-decoration-line:${decorations.join(" ")}`);
    }
    if (style.underline) {
      properties.push(
        `--cf-terminal-token-decoration-style:${style.underline === "curly" ? "wavy" : style.underline === "single" ? "solid" : style.underline}`,
      );
    }
    return properties.length ? properties.join(";") : undefined;
  }
</script>

{#snippet terminalOutputToken(token: TerminalOutputToken)}
  {#if hasTerminalStyle(token.style)}
    <span
      class="cf-terminal-output__token"
      data-bold={token.style.bold || undefined}
      data-dim={token.style.dim || undefined}
      data-italic={token.style.italic || undefined}
      data-underline={token.style.underline}
      data-inverse={token.style.inverse || undefined}
      data-concealed={token.style.concealed || undefined}
      data-strikethrough={token.style.strikethrough || undefined}
      data-overline={token.style.overline || undefined}
      aria-hidden={token.style.concealed || undefined}
      style={terminalTokenStyle(token.style)}>{token.value}</span
    >
  {:else}{token.value}{/if}
{/snippet}

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
          {@const outputRuns = groupTerminalOutput(entry.output)}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access for horizontally scrollable output) -->
          <pre
            class="cf-terminal-code-block__output"
            role="region"
            tabindex="0"
            aria-label={`${outputLabel} ${index + 1}`}><code
              >{#each outputRuns as run}{#if run.href && !run.tokens.every((token) => token.style.concealed)}<a
                    class="cf-terminal-output__link"
                    href={run.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    >{#each run.tokens as token}{@render terminalOutputToken(token)}{/each}</a
                  >{:else}{#each run.tokens as token}{@render terminalOutputToken(
                      token,
                    )}{/each}{/if}{/each}</code
            ></pre>
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
