import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.hoisted(() => vi.fn());

vi.mock("asciinema-player", () => ({ create: createMock }));

import {
  createAsciinemaPlayerController,
  DEFAULT_ASCIINEMA_PLAYER_LABELS,
  resolveAsciinemaPlayerLabels,
  type Player,
} from "../src/index.js";

function player(): Player {
  return {
    el: document.createElement("div"),
    dispose: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    getDuration: vi.fn(() => 1),
    play: vi.fn(async () => undefined),
    pause: vi.fn(async () => undefined),
    seek: vi.fn(async () => undefined),
    addEventListener: vi.fn(),
  };
}

function shell(): HTMLElement {
  const root = document.createElement("figure");
  root.dataset.state = "loading";
  root.setAttribute("aria-busy", "true");
  root.innerHTML = `
    <div data-cf-asciinema-player-stage hidden>
      <div data-cf-asciinema-player-mount></div>
    </div>
    <div data-cf-asciinema-player-fallback data-tone="info" role="status">
      <span data-cf-asciinema-player-fallback-title>Terminal recording</span>
      <a data-cf-asciinema-player-fallback-link hidden></a>
    </div>
  `;
  document.body.append(root);
  return root;
}

beforeEach(() => {
  document.body.replaceChildren();
  createMock.mockReset();
});

describe("createAsciinemaPlayerController", () => {
  it("merges labels without mutating the exported defaults", () => {
    expect(resolveAsciinemaPlayerLabels({ errorTitle: "Unavailable" })).toEqual({
      loadingTitle: "Terminal recording",
      errorTitle: "Unavailable",
      fallbackLink: "Open recording",
    });
    expect(DEFAULT_ASCIINEMA_PLAYER_LABELS.errorTitle).toBe("Player failed to load");
  });

  it("mounts with the token theme, exposes the player, and restores the shell on destroy", async () => {
    const root = shell();
    const createdPlayer = player();
    const onPlayerReady = vi.fn();
    createMock.mockReturnValue(createdPlayer);

    const controller = createAsciinemaPlayerController(root, {
      source: "/demo.cast",
      fallbackHref: "/fallback",
      labels: { fallbackLink: "Open fallback" },
      onPlayerReady,
    });

    expect(root).toHaveAttribute("data-state", "loading");
    expect(root.querySelector("[data-cf-asciinema-player-fallback-link]")).toHaveAttribute(
      "href",
      "/fallback",
    );
    expect(await controller.ready).toBe(createdPlayer);
    expect(createMock).toHaveBeenCalledWith(
      "/demo.cast",
      root.querySelector("[data-cf-asciinema-player-mount]"),
      { theme: "cofob" },
    );
    expect(onPlayerReady).toHaveBeenCalledWith(createdPlayer);
    expect(controller.player).toBe(createdPlayer);
    expect(root).toHaveAttribute("data-state", "ready");
    expect(root).not.toHaveAttribute("aria-busy");
    expect(root.querySelector("[data-cf-asciinema-player-stage]")).not.toHaveAttribute("hidden");
    expect(root.querySelector("[data-cf-asciinema-player-fallback]")).toHaveAttribute("hidden");

    controller.destroy();
    controller.destroy();
    expect(createdPlayer.dispose).toHaveBeenCalledTimes(1);
    expect(controller.player).toBeUndefined();
    expect(root).toHaveAttribute("data-state", "loading");
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(root.querySelector("[data-cf-asciinema-player-stage]")).toHaveAttribute("hidden");
    expect(root.querySelector("[data-cf-asciinema-player-fallback]")).not.toHaveAttribute("hidden");
  });

  it("preserves an explicit upstream theme and caller options", async () => {
    const root = shell();
    const createdPlayer = player();
    const options = { theme: "auto/asciinema", preload: true } as const;
    createMock.mockReturnValue(createdPlayer);

    const controller = createAsciinemaPlayerController(root, { source: "/demo.cast", options });
    await controller.ready;

    expect(createMock).toHaveBeenCalledWith("/demo.cast", expect.any(HTMLElement), {
      theme: "auto/asciinema",
      preload: true,
    });
    expect(options).toEqual({ theme: "auto/asciinema", preload: true });
  });

  it("shows the warning fallback and reports creation failures", async () => {
    const root = shell();
    const error = new Error("module failed");
    const onPlayerLoadError = vi.fn();
    createMock.mockImplementation(() => {
      throw error;
    });

    const controller = createAsciinemaPlayerController(root, {
      source: "/demo.cast",
      labels: { errorTitle: "Recording unavailable" },
      onPlayerLoadError,
    });

    await expect(controller.ready).rejects.toBe(error);
    expect(onPlayerLoadError).toHaveBeenCalledWith(error);
    expect(root).toHaveAttribute("data-state", "error");
    expect(root.querySelector("[data-cf-asciinema-player-fallback]")).toHaveAttribute("data-tone", "warning");
    expect(root.querySelector("[data-cf-asciinema-player-fallback]")).toHaveAttribute("role", "alert");
    expect(root.querySelector("[data-cf-asciinema-player-fallback-title]")).toHaveTextContent(
      "Recording unavailable",
    );
  });

  it("does not create or report an error after early destruction", async () => {
    const root = shell();
    const onPlayerLoadError = vi.fn();
    createMock.mockReturnValue(player());

    const controller = createAsciinemaPlayerController(root, {
      source: "/demo.cast",
      onPlayerLoadError,
    });
    controller.destroy();

    await expect(controller.ready).rejects.toMatchObject({ name: "AbortError" });
    expect(createMock).not.toHaveBeenCalled();
    expect(onPlayerLoadError).not.toHaveBeenCalled();
  });

  it("rejects incomplete Native markup synchronously", () => {
    expect(() =>
      createAsciinemaPlayerController(document.createElement("figure"), { source: "/demo.cast" }),
    ).toThrow(/data-cf-asciinema-player-stage/u);
  });
});
