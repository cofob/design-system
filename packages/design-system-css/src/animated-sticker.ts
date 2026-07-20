import type { Controller } from "./types.js";

export type AnimatedStickerState = "loading" | "playing" | "static" | "reduced-motion" | "fallback";

export type AnimatedStickerController = Controller;

function setState(root: HTMLElement, state: AnimatedStickerState): void {
  root.dataset.state = state;
}

export function createAnimatedStickerController(root: HTMLElement): AnimatedStickerController {
  const initialState = root.getAttribute("data-state");
  const video = root.querySelector<HTMLVideoElement>("[data-cf-animated-sticker-video]");
  const initialSrc = video?.getAttribute("src") ?? null;
  const source = video?.dataset.cfAnimatedStickerSrc ?? initialSrc;
  if (root.dataset.playback === "static") {
    video?.pause();
    video?.removeAttribute("src");
    setState(root, "static");
    return {
      destroy() {
        video?.pause();
        if (video && initialSrc !== null) video.setAttribute("src", initialSrc);
        if (initialState === null) root.removeAttribute("data-state");
        else root.setAttribute("data-state", initialState);
      },
    };
  }
  const view = root.ownerDocument?.defaultView;
  const motion = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
  let destroyed = false;
  let attempt = 0;
  let visible = false;
  let assignedSource = false;

  const pause = (state: Exclude<AnimatedStickerState, "loading" | "playing">) => {
    attempt += 1;
    video?.pause();
    if (video) {
      try {
        video.currentTime = 0;
      } catch {
        // An unloaded media element may reject seeking; the SVG remains visible.
      }
    }
    if (!destroyed) setState(root, state);
  };

  const start = () => {
    if (!video || !source) {
      setState(root, "fallback");
      return;
    }
    if (motion?.matches) {
      pause("reduced-motion");
      return;
    }
    if (!visible) {
      setState(root, "loading");
      return;
    }
    if (!video.hasAttribute("src")) {
      video.src = source;
      assignedSource = true;
    }
    const currentAttempt = ++attempt;
    setState(root, "loading");
    try {
      const playback = video.play();
      void playback?.catch(() => {
        if (!destroyed && attempt === currentAttempt) pause("fallback");
      });
    } catch {
      if (!destroyed && attempt === currentAttempt) pause("fallback");
    }
  };

  const onPlaying = () => {
    if (!destroyed && !motion?.matches) setState(root, "playing");
  };
  const onError = () => pause("fallback");
  const onMotionChange = () => {
    if (motion?.matches) pause("reduced-motion");
    else start();
  };

  const observer =
    video && typeof view?.IntersectionObserver === "function"
      ? new view.IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            visible = true;
            observer?.disconnect();
            start();
          },
          { rootMargin: "0px" },
        )
      : undefined;

  video?.addEventListener("playing", onPlaying);
  video?.addEventListener("error", onError);
  motion?.addEventListener("change", onMotionChange);
  if (observer) {
    observer.observe(root);
    if (motion?.matches) pause("reduced-motion");
    else setState(root, "loading");
  } else {
    visible = true;
    start();
  }

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      attempt += 1;
      video?.removeEventListener("playing", onPlaying);
      video?.removeEventListener("error", onError);
      motion?.removeEventListener("change", onMotionChange);
      observer?.disconnect();
      video?.pause();
      if (video && assignedSource) video.removeAttribute("src");
      if (video && initialSrc !== null) video.setAttribute("src", initialSrc);
      if (initialState === null) root.removeAttribute("data-state");
      else root.setAttribute("data-state", initialState);
    },
  };
}
