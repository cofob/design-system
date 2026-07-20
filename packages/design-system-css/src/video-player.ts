import { addListener, createCleanup } from "./internal/dom.js";
import type { Controller } from "./types.js";

export interface VideoPlayerControllerOptions {
  durationHint?: number;
}

export interface VideoPlayerController extends Controller {
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  toggleFullscreen(): Promise<void>;
}

function finiteDuration(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatTime(value: number): string {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Enhances portable video markup with themed playback, timeline, volume, and fullscreen controls. */
export function createVideoPlayerController(
  root: HTMLElement,
  options: VideoPlayerControllerOptions = {},
): VideoPlayerController {
  const video = root.querySelector<HTMLVideoElement>("[data-cf-video-media], video");
  const startButton = root.querySelector<HTMLButtonElement>("[data-cf-video-start]");
  const playButton = root.querySelector<HTMLButtonElement>("[data-cf-video-play]");
  const timeline = root.querySelector<HTMLInputElement>("[data-cf-video-timeline]");
  const time = root.querySelector<HTMLElement>("[data-cf-video-time]");
  const muteButton = root.querySelector<HTMLButtonElement>("[data-cf-video-mute]");
  const volume = root.querySelector<HTMLInputElement>("[data-cf-video-volume]");
  const fullscreenButton = root.querySelector<HTMLButtonElement>("[data-cf-video-fullscreen]");
  if (!video || !playButton || !timeline || !time || !muteButton || !volume || !fullscreenButton) {
    throw new Error(
      "VideoPlayer requires video, playback, timeline, time, mute, volume, and fullscreen elements.",
    );
  }

  const cleanup = createCleanup();
  const document = root.ownerDocument;
  const durationHint = finiteDuration(options.durationHint ?? Number(root.dataset.durationHint ?? 0));
  const original = {
    controls: video.controls,
    enhanced: root.getAttribute("data-enhanced"),
    state: root.getAttribute("data-state"),
    muted: root.getAttribute("data-muted"),
    fullscreen: root.getAttribute("data-fullscreen"),
    started: root.getAttribute("data-started"),
    playLabel: playButton.getAttribute("aria-label"),
    muteLabel: muteButton.getAttribute("aria-label"),
    fullscreenLabel: fullscreenButton.getAttribute("aria-label"),
    tabIndex: root.getAttribute("tabindex"),
    timelineMax: timeline.getAttribute("max"),
    timelineValue: timeline.value,
    timelineStyle: timeline.getAttribute("style"),
    volumeValue: volume.value,
    volumeStyle: volume.getAttribute("style"),
    timeText: time.textContent,
  };
  const labels = {
    play: playButton.dataset.playLabel ?? "Play video",
    pause: playButton.dataset.pauseLabel ?? "Pause video",
    mute: muteButton.dataset.muteLabel ?? "Mute video",
    unmute: muteButton.dataset.unmuteLabel ?? "Unmute video",
    fullscreen: fullscreenButton.dataset.fullscreenLabel ?? "Enter fullscreen",
    exitFullscreen: fullscreenButton.dataset.exitFullscreenLabel ?? "Exit fullscreen",
  };
  let previousVolume = video.volume || 1;
  let wasFullscreen = false;
  let started = !startButton || !video.paused || video.currentTime > 0;

  const resolvedDuration = () => finiteDuration(video.duration) || durationHint;
  const sync = () => {
    const duration = resolvedDuration();
    const maximum = Math.max(duration, 0.01);
    const current = Math.min(Math.max(video.currentTime || 0, 0), maximum);
    const timelineProgress = duration > 0 ? (current / duration) * 100 : 0;
    const volumeProgress = video.muted ? 0 : video.volume * 100;
    const fullscreen = document.fullscreenElement === root;
    timeline.max = String(maximum);
    timeline.value = String(current);
    timeline.style.setProperty("--cf-video-progress", `${timelineProgress}%`);
    timeline.setAttribute("aria-valuetext", `${formatTime(current)} of ${formatTime(duration)}`);
    volume.value = String(video.muted ? 0 : video.volume);
    volume.style.setProperty("--cf-video-progress", `${volumeProgress}%`);
    volume.setAttribute("aria-valuetext", `${Math.round(volumeProgress)}%`);
    time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    root.dataset.state = video.paused ? "paused" : "playing";
    root.dataset.started = String(started);
    root.dataset.muted = String(video.muted || video.volume === 0);
    root.dataset.fullscreen = String(fullscreen);
    playButton.setAttribute("aria-label", video.paused ? labels.play : labels.pause);
    muteButton.setAttribute("aria-label", video.muted || video.volume === 0 ? labels.unmute : labels.mute);
    fullscreenButton.setAttribute("aria-label", fullscreen ? labels.exitFullscreen : labels.fullscreen);
  };
  const play = async () => {
    try {
      await video.play();
      started = true;
      if (document.activeElement === startButton) playButton.focus({ preventScroll: true });
    } catch {
      root.dataset.state = "paused";
    }
    sync();
  };
  const pause = () => {
    video.pause();
    sync();
  };
  const seek = (nextTime: number) => {
    video.currentTime = Math.max(0, Math.min(nextTime, Math.max(resolvedDuration(), 0.01)));
    sync();
  };
  const setVolume = (nextVolume: number) => {
    const normalized = Math.max(0, Math.min(nextVolume, 1));
    video.volume = normalized;
    video.muted = normalized === 0;
    if (normalized > 0) previousVolume = normalized;
    sync();
  };
  const toggleMute = () => {
    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = previousVolume || 1;
    } else {
      previousVolume = video.volume;
      video.muted = true;
    }
    sync();
  };
  const toggleFullscreen = async () => {
    if (document.fullscreenElement === root) await document.exitFullscreen?.();
    else {
      await root.requestFullscreen?.();
      if (document.fullscreenElement === root) root.focus({ preventScroll: true });
    }
    sync();
  };
  const handleFullscreenChange = () => {
    const isFullscreen = document.fullscreenElement === root;
    if (isFullscreen) root.focus({ preventScroll: true });
    else if (wasFullscreen) fullscreenButton.focus({ preventScroll: true });
    wasFullscreen = isFullscreen;
    sync();
  };
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as Element | null;
    if (target?.closest("input, select, textarea, [contenteditable]:not([contenteditable='false'])")) return;
    if (target?.closest("button, a[href]") && (event.key === " " || event.key === "Enter")) return;

    const key = event.key.toLowerCase();
    if (key === " " || key === "k") {
      event.preventDefault();
      if (video.paused) void play();
      else pause();
    } else if (key === "arrowleft") {
      event.preventDefault();
      seek(video.currentTime - 5);
    } else if (key === "arrowright") {
      event.preventDefault();
      seek(video.currentTime + 5);
    } else if (key === "arrowup") {
      event.preventDefault();
      setVolume((video.muted ? previousVolume : video.volume) + 0.1);
    } else if (key === "arrowdown") {
      event.preventDefault();
      setVolume((video.muted ? previousVolume : video.volume) - 0.1);
    } else if (key === "m") {
      event.preventDefault();
      toggleMute();
    } else if (key === "f") {
      event.preventDefault();
      void toggleFullscreen();
    }
  };

  video.controls = false;
  if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
  root.dataset.enhanced = "true";
  if (startButton) cleanup.add(addListener(startButton, "click", () => void play()));
  cleanup.add(addListener(playButton, "click", () => (video.paused ? void play() : pause())));
  cleanup.add(addListener(video, "click", () => (video.paused ? void play() : pause())));
  cleanup.add(addListener(timeline, "input", () => seek(timeline.valueAsNumber)));
  cleanup.add(addListener(muteButton, "click", toggleMute));
  cleanup.add(addListener(volume, "input", () => setVolume(volume.valueAsNumber)));
  cleanup.add(addListener(fullscreenButton, "click", () => void toggleFullscreen()));
  cleanup.add(addListener(root, "keydown", (event) => handleKeydown(event as KeyboardEvent)));
  cleanup.add(addListener(document, "fullscreenchange", handleFullscreenChange));
  for (const eventName of ["durationchange", "loadedmetadata", "pause", "timeupdate", "ended"]) {
    cleanup.add(addListener(video, eventName, sync));
  }
  cleanup.add(
    addListener(video, "play", () => {
      started = true;
      sync();
    }),
  );
  sync();

  return {
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    destroy() {
      cleanup.destroy();
      video.pause();
      video.controls = original.controls;
      for (const [attribute, value] of [
        ["data-enhanced", original.enhanced],
        ["data-state", original.state],
        ["data-muted", original.muted],
        ["data-fullscreen", original.fullscreen],
        ["data-started", original.started],
      ] as const) {
        if (value === null) root.removeAttribute(attribute);
        else root.setAttribute(attribute, value);
      }
      for (const [element, attribute, value] of [
        [playButton, "aria-label", original.playLabel],
        [muteButton, "aria-label", original.muteLabel],
        [fullscreenButton, "aria-label", original.fullscreenLabel],
      ] as const) {
        if (value === null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
      }
      if (original.timelineMax === null) timeline.removeAttribute("max");
      else timeline.setAttribute("max", original.timelineMax);
      if (original.tabIndex === null) root.removeAttribute("tabindex");
      else root.setAttribute("tabindex", original.tabIndex);
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
