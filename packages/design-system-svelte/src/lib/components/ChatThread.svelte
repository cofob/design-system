<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { ChatMessage } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
    messages: readonly ChatMessage[];
    label?: string;
  }

  let { messages, label = "Conversation", class: className, ...rest }: Props = $props();
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
          {#if typeof message.body === "string"}{message.body}{:else}{@render message.body()}{/if}
        </div>
      </div>
    </li>
  {/each}
</ol>
