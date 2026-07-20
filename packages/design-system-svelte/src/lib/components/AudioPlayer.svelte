<script lang="ts">
  import type { HTMLAttributes, HTMLAudioAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface AudioPlayerLabels {
    play: string;
    pause: string;
    timeline: string;
    mute: string;
    unmute: string;
    volume: string;
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    src: string;
    durationHint?: number;
    disabled?: boolean;
    labels?: Partial<AudioPlayerLabels>;
    audioProps?: Omit<HTMLAudioAttributes, "src" | "controls">;
  }

  let {
    src,
    durationHint = 0,
    disabled = false,
    labels = {},
    audioProps = {},
    class: className,
    ...rest
  }: Props = $props();

  const copy = $derived({
    play: labels.play ?? "Play audio",
    pause: labels.pause ?? "Pause audio",
    timeline: labels.timeline ?? "Playback position",
    mute: labels.mute ?? "Mute audio",
    unmute: labels.unmute ?? "Unmute audio",
    volume: labels.volume ?? "Volume",
  });
  let audio: HTMLAudioElement;
  let currentTime = $state(0);
  let duration = $state(0);
  let muted = $state(false);
  let playing = $state(false);
  let volume = $state(1);
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
    duration = finiteDuration(audio?.duration) || finiteDuration(durationHint);
  }

  async function togglePlayback() {
    if (!audio || disabled) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      playing = false;
    }
  }

  function seek(next: number) {
    if (!audio) return;
    audio.currentTime = next;
    currentTime = next;
  }

  function changeVolume(next: number) {
    if (!audio) return;
    audio.volume = next;
    audio.muted = next === 0;
    if (next > 0) previousVolume = next;
    volume = next;
    muted = next === 0;
  }

  function toggleMute() {
    if (!audio || disabled) return;
    if (audio.muted || volume === 0) {
      const restored = previousVolume || 1;
      audio.muted = false;
      audio.volume = restored;
      volume = restored;
      muted = false;
    } else {
      previousVolume = volume;
      audio.muted = true;
      muted = true;
    }
  }
</script>

<div
  class={cx("cf-audio-player", className)}
  data-state={playing ? "playing" : "paused"}
  data-muted={muted || volume === 0}
  data-cf-audio-player-managed="true"
  {...rest}
>
  <audio
    {...audioProps}
    bind:this={audio}
    {src}
    preload={audioProps.preload ?? "metadata"}
    ondurationchange={(event) => {
      audioProps.ondurationchange?.(event);
      if (!event.defaultPrevented) syncDuration();
    }}
    onloadedmetadata={(event) => {
      audioProps.onloadedmetadata?.(event);
      if (!event.defaultPrevented) syncDuration();
    }}
    onended={(event) => {
      audioProps.onended?.(event);
      playing = false;
    }}
    onpause={(event) => {
      audioProps.onpause?.(event);
      playing = false;
    }}
    onplay={(event) => {
      audioProps.onplay?.(event);
      playing = true;
    }}
    ontimeupdate={(event) => {
      audioProps.ontimeupdate?.(event);
      currentTime = event.currentTarget.currentTime;
    }}
  ></audio>
  <button
    class="cf-audio-player__button"
    type="button"
    aria-label={playing ? copy.pause : copy.play}
    {disabled}
    onclick={() => void togglePlayback()}
  >
    <span class="cf-audio-player__icon cf-audio-player__play-icon" aria-hidden="true"></span>
  </button>
  <input
    class="cf-audio-player__range cf-audio-player__timeline"
    type="range"
    min="0"
    max={timelineMax}
    step="0.01"
    value={timelineValue}
    aria-label={copy.timeline}
    aria-valuetext={`${formatTime(timelineValue)} of ${formatTime(resolvedDuration)}`}
    {disabled}
    style={`--cf-audio-progress:${timelineProgress}%`}
    oninput={(event) => seek(event.currentTarget.valueAsNumber)}
  />
  <span class="cf-audio-player__time">{formatTime(timelineValue)} / {formatTime(resolvedDuration)}</span>
  <div class="cf-audio-player__volume">
    <button
      class="cf-audio-player__button"
      type="button"
      aria-label={muted || volume === 0 ? copy.unmute : copy.mute}
      {disabled}
      onclick={toggleMute}
    >
      <span class="cf-audio-player__icon cf-audio-player__volume-icon" aria-hidden="true"></span>
    </button>
    <input
      class="cf-audio-player__range"
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={muted ? 0 : volume}
      aria-label={copy.volume}
      aria-valuetext={`${Math.round(volumeProgress)}%`}
      {disabled}
      style={`--cf-audio-progress:${volumeProgress}%`}
      oninput={(event) => changeVolume(event.currentTarget.valueAsNumber)}
    />
  </div>
</div>
