<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { ChatMessage } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
    messages: readonly ChatMessage[];
    label?: string;
  }

  let { messages, label = "Conversation", class: className, ...rest }: Props = $props();

  function isSnippet(value: ChatMessage["body"]): value is Exclude<ChatMessage["body"], string | undefined> {
    return typeof value === "function";
  }
</script>

<ol class={cx("cf-chat-thread", className)} aria-label={label} {...rest}>
  {#each messages as message (message.id)}
    <li class="cf-chat__row" data-own={message.own || undefined}>
      {#if message.avatar}
        <img
          class="cf-chat__avatar"
          src={message.avatar.src}
          alt=""
          width={message.avatar.width}
          height={message.avatar.height}
          srcset={message.avatar.srcSet ?? message.avatar.srcset}
          sizes={message.avatar.sizes}
          loading="lazy"
          decoding="async"
        />
      {:else}
        <span class="cf-chat__avatar" aria-hidden="true">{message.author.slice(0, 1).toUpperCase()}</span>
      {/if}
      <div class="cf-chat__message">
        <p class="cf-chat__author">
          <strong>{message.author}</strong>{#if message.timestamp}<time datetime={message.timestamp}
              >{message.timestamp}</time
            >{/if}
        </p>
        <div class="cf-chat__bubble">
          {#if typeof message.body === "string"}
            {message.body}
          {:else if isSnippet(message.body)}
            {@render message.body()}
          {:else}
            {message.text ?? ""}
          {/if}
          {#if message.link}
            {#if message.body !== undefined || message.text}<br />{/if}<a
              class="cf-link"
              href={message.link}
              target={message.linkExternal ? "_blank" : undefined}
              rel={message.linkExternal ? "noopener noreferrer" : undefined}
              >{message.linkLabel ?? message.link}</a
            >
          {/if}
        </div>
      </div>
    </li>
  {/each}
</ol>
