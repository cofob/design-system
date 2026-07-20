<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes, HTMLVideoAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface VideoPlayerLabels {
    play: string;
    pause: string;
    timeline: string;
    mute: string;
    unmute: string;
    volume: string;
    fullscreen: string;
    exitFullscreen: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    src: string;
    label: string;
    caption?: string;
    aspectRatio?: string;
    durationHint?: number;
    disabled?: boolean;
    labels?: Partial<VideoPlayerLabels>;
    videoProps?: Omit<HTMLVideoAttributes, "src" | "controls" | "children">;
    children?: Snippet;
  }

  let {
    src,
    label,
    caption,
    aspectRatio = "16 / 9",
    durationHint = 0,
    disabled = false,
    labels = {},
    videoProps = {},
    children,
    class: className,
    style,
    tabindex = -1,
    onkeydown,
    ...rest
  }: Props = $props();

  const copy = $derived({
    play: labels.play ?? "Play video",
    pause: labels.pause ?? "Pause video",
    timeline: labels.timeline ?? "Playback position",
    mute: labels.mute ?? "Mute video",
    unmute: labels.unmute ?? "Unmute video",
    volume: labels.volume ?? "Volume",
    fullscreen: labels.fullscreen ?? "Enter fullscreen",
    exitFullscreen: labels.exitFullscreen ?? "Exit fullscreen",
  });
  let root: HTMLElement;
  let video: HTMLVideoElement;
  let startButton: HTMLButtonElement;
  let playButton: HTMLButtonElement;
  let fullscreenButton: HTMLButtonElement;
  let enhanced = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let muted = $state(false);
  let playing = $state(false);
  let started = $state(false);
  let volume = $state(1);
  let fullscreen = $state(false);
  let previousVolume = 1;
  const resolvedDuration = $derived(finiteDuration(duration) || finiteDuration(durationHint));
  const timelineMax = $derived(Math.max(resolvedDuration, 0.01));
  const timelineValue = $derived(Math.min(currentTime, timelineMax));
  const timelineProgress = $derived(resolvedDuration > 0 ? (timelineValue / resolvedDuration) * 100 : 0);
  const volumeProgress = $derived(muted ? 0 : volume * 100);

  function finiteDuration(value: number) {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function formatTime(value: number) {
    const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function syncDuration() {
    duration = finiteDuration(video?.duration) || finiteDuration(durationHint);
  }

  async function togglePlayback() {
    if (!video || disabled) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      await video.play();
      started = true;
      if (document.activeElement === startButton) playButton.focus({ preventScroll: true });
    } catch {
      playing = false;
    }
  }

  function seek(next: number) {
    if (!video) return;
    const normalized = Math.max(0, Math.min(next, timelineMax));
    video.currentTime = normalized;
    currentTime = normalized;
  }

  function changeVolume(next: number) {
    if (!video) return;
    const normalized = Math.max(0, Math.min(next, 1));
    video.volume = normalized;
    video.muted = normalized === 0;
    if (normalized > 0) previousVolume = normalized;
    volume = normalized;
    muted = normalized === 0;
  }

  function toggleMute() {
    if (!video || disabled) return;
    if (video.muted || volume === 0) {
      const restored = previousVolume || 1;
      video.muted = false;
      video.volume = restored;
      volume = restored;
      muted = false;
    } else {
      previousVolume = volume;
      video.muted = true;
      muted = true;
    }
  }

  async function toggleFullscreen() {
    if (!root || disabled || typeof document === "undefined") return;
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen?.();
      else await root.requestFullscreen?.();
    } finally {
      fullscreen = document.fullscreenElement === root;
      if (fullscreen) root.focus({ preventScroll: true });
    }
  }

  function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLElement }) {
    onkeydown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || disabled) return;
    const target = event.target as Element;
    if (target.closest("input, select, textarea, [contenteditable]:not([contenteditable='false'])")) return;
    if (target.closest("button, a[href]") && (event.key === " " || event.key === "Enter")) return;

    const key = event.key.toLowerCase();
    if (key === " " || key === "k") {
      event.preventDefault();
      void togglePlayback();
    } else if (key === "arrowleft") {
      event.preventDefault();
      seek(video.currentTime - 5);
    } else if (key === "arrowright") {
      event.preventDefault();
      seek(video.currentTime + 5);
    } else if (key === "arrowup") {
      event.preventDefault();
      changeVolume((video.muted ? previousVolume : video.volume) + 0.1);
    } else if (key === "arrowdown") {
      event.preventDefault();
      changeVolume((video.muted ? previousVolume : video.volume) - 0.1);
    } else if (key === "m") {
      event.preventDefault();
      toggleMute();
    } else if (key === "f") {
      event.preventDefault();
      void toggleFullscreen();
    }
  }

  $effect(() => {
    muted = Boolean(videoProps.muted);
  });

  $effect(() => {
    enhanced = true;
    if (typeof document === "undefined") return;
    let wasFullscreen = document.fullscreenElement === root;
    const syncFullscreen = () => {
      fullscreen = document.fullscreenElement === root;
      if (fullscreen) root.focus({ preventScroll: true });
      else if (wasFullscreen) fullscreenButton.focus({ preventScroll: true });
      wasFullscreen = fullscreen;
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (programmatic fullscreen focus target) -->
<figure
  bind:this={root}
  class={cx("cf-video-player", className)}
  data-enhanced={enhanced}
  data-state={playing ? "playing" : "paused"}
  data-muted={muted || volume === 0}
  data-fullscreen={fullscreen}
  data-started={started}
  data-cf-video-player-managed="true"
  style={`--cf-video-aspect-ratio:${aspectRatio};${style ?? ""}`}
  {...rest}
  {tabindex}
  onkeydown={handleKeydown}
>
  <div class="cf-video-player__frame">
    <video
      {...videoProps}
      bind:this={video}
      class={cx("cf-video-player__media", videoProps.class)}
      {src}
      controls={!enhanced}
      playsinline={videoProps.playsinline ?? true}
      preload={videoProps.preload ?? "metadata"}
      aria-label={videoProps["aria-label"] ?? label}
      onclick={(event) => {
        videoProps.onclick?.(event);
        if (!event.defaultPrevented) void togglePlayback();
      }}
      ondurationchange={(event) => {
        videoProps.ondurationchange?.(event);
        if (!event.defaultPrevented) syncDuration();
      }}
      onloadedmetadata={(event) => {
        videoProps.onloadedmetadata?.(event);
        if (!event.defaultPrevented) syncDuration();
      }}
      onended={(event) => {
        videoProps.onended?.(event);
        playing = false;
      }}
      onpause={(event) => {
        videoProps.onpause?.(event);
        playing = false;
      }}
      onplay={(event) => {
        videoProps.onplay?.(event);
        playing = true;
        started = true;
      }}
      ontimeupdate={(event) => {
        videoProps.ontimeupdate?.(event);
        currentTime = event.currentTarget.currentTime;
      }}>{@render children?.()}</video
    >
    <button
      bind:this={startButton}
      class="cf-video-player__start"
      type="button"
      aria-label={copy.play}
      {disabled}
      onclick={() => void togglePlayback()}
    >
      <span class="cf-video-player__start-icon" aria-hidden="true"></span>
    </button>
    <div class="cf-video-player__controls">
      <input
        class="cf-video-player__range cf-video-player__timeline"
        type="range"
        min="0"
        max={timelineMax}
        step="0.01"
        value={timelineValue}
        aria-label={copy.timeline}
        aria-valuetext={`${formatTime(timelineValue)} of ${formatTime(resolvedDuration)}`}
        {disabled}
        style={`--cf-video-progress:${timelineProgress}%`}
        oninput={(event) => seek(event.currentTarget.valueAsNumber)}
      />
      <button
        bind:this={playButton}
        class="cf-video-player__button"
        type="button"
        aria-label={playing ? copy.pause : copy.play}
        {disabled}
        onclick={() => void togglePlayback()}
      >
        <span class="cf-video-player__icon cf-video-player__play-icon" aria-hidden="true"></span>
      </button>
      <span class="cf-video-player__time">{formatTime(timelineValue)} / {formatTime(resolvedDuration)}</span>
      <div class="cf-video-player__volume">
        <button
          class="cf-video-player__button"
          type="button"
          aria-label={muted || volume === 0 ? copy.unmute : copy.mute}
          {disabled}
          onclick={toggleMute}
        >
          <span class="cf-video-player__icon cf-video-player__volume-icon" aria-hidden="true"></span>
        </button>
        <input
          class="cf-video-player__range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={muted ? 0 : volume}
          aria-label={copy.volume}
          aria-valuetext={`${Math.round(volumeProgress)}%`}
          {disabled}
          style={`--cf-video-progress:${volumeProgress}%`}
          oninput={(event) => changeVolume(event.currentTarget.valueAsNumber)}
        />
      </div>
      <button
        bind:this={fullscreenButton}
        class="cf-video-player__button cf-video-player__fullscreen"
        type="button"
        aria-label={fullscreen ? copy.exitFullscreen : copy.fullscreen}
        {disabled}
        onclick={() => void toggleFullscreen()}
      >
        <span class="cf-video-player__icon cf-video-player__fullscreen-icon" aria-hidden="true"></span>
      </button>
    </div>
  </div>
  {#if caption}<figcaption class="cf-video-player__caption">{caption}</figcaption>{/if}
</figure>
