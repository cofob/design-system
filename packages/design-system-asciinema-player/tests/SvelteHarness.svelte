<script lang="ts">
  import type { Options, Player, Source } from "../src/index.js";
  import { AsciinemaPlayer } from "../src/svelte/index.js";

  let { source, options = {} }: { source: Source; options?: Options } = $props();
  let player = $state.raw<Player>();

  export function getPlayer() {
    return player;
  }
</script>

<AsciinemaPlayer {source} {options} bind:player />
