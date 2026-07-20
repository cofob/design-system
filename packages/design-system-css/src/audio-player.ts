import { addListener, createCleanup } from "./internal/dom.js";
import type { Controller } from "./types.js";

export interface AudioPlayerControllerOptions {
  durationHint?: number;
}

export interface AudioPlayerController extends Controller {
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
}

function finiteDuration(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatTime(value: number): string {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Connects the portable audio-player markup to its native media element. */
export function createAudioPlayerController(
  root: HTMLElement,
  options: AudioPlayerControllerOptions = {},
): AudioPlayerController {
  const audio = root.querySelector<HTMLAudioElement>("audio");
  const playButton = root.querySelector<HTMLButtonElement>("[data-cf-audio-play]");
  const timeline = root.querySelector<HTMLInputElement>("[data-cf-audio-timeline]");
  const time = root.querySelector<HTMLElement>("[data-cf-audio-time]");
  const muteButton = root.querySelector<HTMLButtonElement>("[data-cf-audio-mute]");
  const volume = root.querySelector<HTMLInputElement>("[data-cf-audio-volume]");
  if (!audio || !playButton || !timeline || !time || !muteButton || !volume) {
    throw new Error("AudioPlayer requires audio, playback, timeline, time, mute, and volume elements.");
  }

  const cleanup = createCleanup();
  const durationHint = finiteDuration(options.durationHint ?? Number(root.dataset.durationHint ?? 0));
  const original = {
    state: root.getAttribute("data-state"),
    muted: root.getAttribute("data-muted"),
    playLabel: playButton.getAttribute("aria-label"),
    muteLabel: muteButton.getAttribute("aria-label"),
    timelineMax: timeline.getAttribute("max"),
    timelineValue: timeline.value,
    timelineStyle: timeline.getAttribute("style"),
    volumeValue: volume.value,
    volumeStyle: volume.getAttribute("style"),
    timeText: time.textContent,
  };
  const playLabel = playButton.dataset.playLabel ?? "Play audio";
  const pauseLabel = playButton.dataset.pauseLabel ?? "Pause audio";
  const muteLabel = muteButton.dataset.muteLabel ?? "Mute audio";
  const unmuteLabel = muteButton.dataset.unmuteLabel ?? "Unmute audio";
  let previousVolume = audio.volume || 1;

  const resolvedDuration = () => finiteDuration(audio.duration) || durationHint;
  const sync = () => {
    const duration = resolvedDuration();
    const maximum = Math.max(duration, 0.01);
    const current = Math.min(Math.max(audio.currentTime || 0, 0), maximum);
    const timelineProgress = duration > 0 ? (current / duration) * 100 : 0;
    const volumeProgress = audio.muted ? 0 : audio.volume * 100;
    timeline.max = String(maximum);
    timeline.value = String(current);
    timeline.style.setProperty("--cf-audio-progress", `${timelineProgress}%`);
    timeline.setAttribute("aria-valuetext", `${formatTime(current)} of ${formatTime(duration)}`);
    volume.value = String(audio.muted ? 0 : audio.volume);
    volume.style.setProperty("--cf-audio-progress", `${volumeProgress}%`);
    volume.setAttribute("aria-valuetext", `${Math.round(volumeProgress)}%`);
    time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    root.dataset.state = audio.paused ? "paused" : "playing";
    root.dataset.muted = String(audio.muted || audio.volume === 0);
    playButton.setAttribute("aria-label", audio.paused ? playLabel : pauseLabel);
    muteButton.setAttribute("aria-label", audio.muted || audio.volume === 0 ? unmuteLabel : muteLabel);
  };
  const play = async () => {
    try {
      await audio.play();
    } catch {
      root.dataset.state = "paused";
    }
    sync();
  };
  const pause = () => {
    audio.pause();
    sync();
  };
  const seek = (nextTime: number) => {
    audio.currentTime = Math.max(0, Math.min(nextTime, Math.max(resolvedDuration(), 0.01)));
    sync();
  };
  const setVolume = (nextVolume: number) => {
    const normalized = Math.max(0, Math.min(nextVolume, 1));
    audio.volume = normalized;
    audio.muted = normalized === 0;
    if (normalized > 0) previousVolume = normalized;
    sync();
  };
  const toggleMute = () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      audio.volume = previousVolume || 1;
    } else {
      previousVolume = audio.volume;
      audio.muted = true;
    }
    sync();
  };

  cleanup.add(addListener(playButton, "click", () => (audio.paused ? void play() : pause())));
  cleanup.add(addListener(timeline, "input", () => seek(timeline.valueAsNumber)));
  cleanup.add(addListener(muteButton, "click", toggleMute));
  cleanup.add(addListener(volume, "input", () => setVolume(volume.valueAsNumber)));
  for (const eventName of ["durationchange", "loadedmetadata", "pause", "play", "timeupdate", "ended"]) {
    cleanup.add(addListener(audio, eventName, sync));
  }
  sync();

  return {
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    destroy() {
      cleanup.destroy();
      audio.pause();
      for (const [attribute, value] of [
        ["data-state", original.state],
        ["data-muted", original.muted],
      ] as const) {
        if (value === null) root.removeAttribute(attribute);
        else root.setAttribute(attribute, value);
      }
      if (original.playLabel === null) playButton.removeAttribute("aria-label");
      else playButton.setAttribute("aria-label", original.playLabel);
      if (original.muteLabel === null) muteButton.removeAttribute("aria-label");
      else muteButton.setAttribute("aria-label", original.muteLabel);
      if (original.timelineMax === null) timeline.removeAttribute("max");
      else timeline.setAttribute("max", original.timelineMax);
      timeline.value = original.timelineValue;
      volume.value = original.volumeValue;
      if (original.timelineStyle === null) timeline.removeAttribute("style");
      else timeline.setAttribute("style", original.timelineStyle);
      if (original.volumeStyle === null) volume.removeAttribute("style");
      else volume.setAttribute("style", original.volumeStyle);
      time.textContent = original.timeText;
    },
  };
}
