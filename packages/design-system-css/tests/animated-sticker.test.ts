import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAnimatedStickerController,
  getAnimatedStickersEnabled,
  initDesignSystem,
  setAnimatedStickersEnabled,
} from "../src/index.js";

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-cf-animated-stickers");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockMotion(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();
  const media = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: () => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: () => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  return {
    setMatches(next: boolean) {
      matches = next;
      for (const listener of listeners) listener();
    },
  };
}

function mockIntersection() {
  let callback: IntersectionObserverCallback | undefined;
  const disconnect = vi.fn();
  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];
    constructor(listener: IntersectionObserverCallback) {
      callback = listener;
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = disconnect;
    takeRecords = () => [];
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  return {
    enter(target: Element) {
      callback?.([{ isIntersecting: true, target } as IntersectionObserverEntry], {} as IntersectionObserver);
    },
    leave(target: Element) {
      callback?.(
        [{ isIntersecting: false, target } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    },
    disconnect,
  };
}

function renderSticker() {
  document.body.innerHTML = `
    <span data-cf-animated-sticker data-state="loading">
      <span class="cf-animated-sticker__skeleton"><svg viewBox="0 0 512 512"></svg></span>
      <video data-cf-animated-sticker-video data-cf-animated-sticker-src="/chris.webm"></video>
    </span>
  `;
  const root = document.querySelector<HTMLElement>("[data-cf-animated-sticker]")!;
  const video = root.querySelector<HTMLVideoElement>("video")!;
  return { root, video };
}

describe("animated sticker controller", () => {
  it("reveals video only after playing and responds to dynamic reduced motion", () => {
    const motion = mockMotion();
    const intersection = mockIntersection();
    const { root, video } = renderSticker();
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    Object.defineProperties(video, {
      play: { configurable: true, value: play },
      pause: { configurable: true, value: pause },
    });

    const controller = createAnimatedStickerController(root);
    expect(root.dataset.state).toBe("loading");
    expect(video.hasAttribute("src")).toBe(false);
    expect(play).not.toHaveBeenCalled();

    intersection.enter(root);
    expect(video.getAttribute("src")).toBe("/chris.webm");
    expect(play).toHaveBeenCalledOnce();

    video.dispatchEvent(new Event("playing"));
    expect(root.dataset.state).toBe("playing");
    expect(root.querySelector(".cf-animated-sticker__skeleton")).toBeNull();

    intersection.leave(root);
    expect(pause).toHaveBeenCalledOnce();
    expect(root.dataset.state).toBe("paused");
    expect(root.querySelector(".cf-animated-sticker__skeleton")).toBeNull();
    video.dispatchEvent(new Event("playing"));
    expect(root.dataset.state).toBe("paused");

    intersection.enter(root);
    expect(play).toHaveBeenCalledTimes(2);
    video.dispatchEvent(new Event("playing"));
    expect(root.dataset.state).toBe("playing");

    motion.setMatches(true);
    expect(pause).toHaveBeenCalledTimes(2);
    expect(root.dataset.state).toBe("reduced-motion");
    expect(root.querySelector(".cf-animated-sticker__skeleton > svg")).not.toBeNull();

    motion.setMatches(false);
    expect(play).toHaveBeenCalledTimes(3);
    expect(root.dataset.state).toBe("loading");
    video.dispatchEvent(new Event("playing"));
    expect(root.dataset.state).toBe("playing");
    expect(root.querySelector(".cf-animated-sticker__skeleton")).toBeNull();

    controller.destroy();
    expect(pause).toHaveBeenCalledTimes(3);
    expect(video.hasAttribute("src")).toBe(false);
    expect(intersection.disconnect).toHaveBeenCalled();
    expect(root.dataset.state).toBe("loading");
    expect(root.querySelector(".cf-animated-sticker__skeleton > svg")).not.toBeNull();
    video.dispatchEvent(new Event("playing"));
    expect(root.dataset.state).toBe("loading");
  });

  it("keeps the inline skeleton visible when play fails", async () => {
    mockMotion();
    const { root, video } = renderSticker();
    Object.defineProperties(video, {
      play: { configurable: true, value: vi.fn(() => Promise.reject(new Error("blocked"))) },
      pause: { configurable: true, value: vi.fn() },
    });

    const controller = createAnimatedStickerController(root);
    await Promise.resolve();
    expect(root.dataset.state).toBe("fallback");
    expect(root.querySelector("svg")).not.toBeNull();
    controller.destroy();
  });

  it("never creates a media request in explicit static mode", () => {
    mockMotion();
    const intersection = mockIntersection();
    const { root, video } = renderSticker();
    root.dataset.playback = "static";
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    Object.defineProperties(video, {
      play: { configurable: true, value: play },
      pause: { configurable: true, value: pause },
    });

    const controller = createAnimatedStickerController(root);
    intersection.enter(root);
    expect(root.dataset.state).toBe("static");
    expect(video.hasAttribute("src")).toBe(false);
    expect(play).not.toHaveBeenCalled();
    controller.destroy();
  });

  it("unloads WebM globally, restores the SVG, and observes direct flag changes", async () => {
    mockMotion();
    const intersection = mockIntersection();
    const { root, video } = renderSticker();
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    const load = vi.fn();
    Object.defineProperties(video, {
      play: { configurable: true, value: play },
      pause: { configurable: true, value: pause },
      load: { configurable: true, value: load },
    });
    setAnimatedStickersEnabled(false);

    const controller = createAnimatedStickerController(root);
    intersection.enter(root);
    expect(root.dataset.state).toBe("disabled");
    expect(video.hasAttribute("src")).toBe(false);
    expect(play).not.toHaveBeenCalled();

    setAnimatedStickersEnabled(true);
    expect(root.dataset.state).toBe("loading");
    expect(video.getAttribute("src")).toBe("/chris.webm");
    expect(play).toHaveBeenCalledOnce();
    video.dispatchEvent(new Event("playing"));
    expect(root.querySelector(".cf-animated-sticker__skeleton")).toBeNull();

    document.documentElement.setAttribute("data-cf-animated-stickers", "disabled");
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(getAnimatedStickersEnabled()).toBe(false);
    expect(root.dataset.state).toBe("disabled");
    expect(video.hasAttribute("src")).toBe(false);
    expect(load).toHaveBeenCalledOnce();
    expect(root.querySelector(".cf-animated-sticker__skeleton > svg")).not.toBeNull();
    controller.destroy();
  });

  it("connects a native switch to the global flag without affecting static images", () => {
    mockMotion(true);
    document.body.innerHTML = `
      <label data-cf-animated-sticker-toggle-root data-state="checked">
        <input type="checkbox" role="switch" data-cf-animated-sticker-toggle checked>
      </label>
      <img src="/static-sticker.webp" alt="Static sticker">
    `;
    const controller = initDesignSystem(document);
    const toggle = document.querySelector<HTMLInputElement>("[data-cf-animated-sticker-toggle]")!;
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));

    expect(document.documentElement.dataset.cfAnimatedStickers).toBe("disabled");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(document.querySelector("img")?.getAttribute("src")).toBe("/static-sticker.webp");
    controller.destroy();
  });

  it("initializes native stickers but skips framework-managed roots", () => {
    mockMotion(true);
    document.body.innerHTML = `
      <span data-cf-animated-sticker><video data-cf-animated-sticker-video data-cf-animated-sticker-src="/native.webm"></video></span>
      <span data-cf-animated-sticker data-cf-animated-sticker-managed data-state="loading">
        <video data-cf-animated-sticker-video data-cf-animated-sticker-src="/managed.webm"></video>
      </span>
    `;
    const [native, managed] = Array.from(
      document.querySelectorAll<HTMLElement>("[data-cf-animated-sticker]"),
    );
    for (const video of document.querySelectorAll("video")) {
      Object.defineProperty(video, "pause", { configurable: true, value: vi.fn() });
    }

    const controller = initDesignSystem(document);
    expect(native?.dataset.state).toBe("reduced-motion");
    expect(managed?.dataset.state).toBe("loading");
    controller.destroy();
  });
});
