import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.hoisted(() => vi.fn());

vi.mock("asciinema-player", () => ({ create: createMock }));

import type { Player } from "../src/index.js";
import { AsciinemaPlayer } from "../src/react/index.js";

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

beforeEach(() => createMock.mockReset());

describe("React AsciinemaPlayer", () => {
  it("server-renders the accessible loading fallback without mounting upstream", () => {
    const html = renderToString(
      <AsciinemaPlayer
        source="/demo.cast"
        label="Build demonstration"
        fallbackHref="/player/demo"
        labels={{ fallbackLink: "Open standalone player" }}
      />,
    );

    expect(html).toContain("cf-asciinema-player");
    expect(html).toContain('aria-label="Build demonstration"');
    expect(html).toContain('data-state="loading"');
    expect(html).toContain('href="/player/demo"');
    expect(html).toContain("Open standalone player");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("forwards its figure ref, reports readiness, and remounts for source or option changes", async () => {
    const first = player();
    const second = player();
    const third = player();
    const onPlayerReady = vi.fn();
    createMock.mockReturnValueOnce(first).mockReturnValueOnce(second).mockReturnValueOnce(third);
    let root: HTMLElement | null = null;
    const firstOptions = { cols: 80 };

    const view = render(
      <AsciinemaPlayer
        ref={(element) => {
          root = element;
        }}
        source="/first.cast"
        options={firstOptions}
        onPlayerReady={onPlayerReady}
      />,
    );

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(root).toBe(screen.getByRole("figure", { name: "Terminal recording" }));
    expect(onPlayerReady).toHaveBeenLastCalledWith(first);

    view.rerender(
      <AsciinemaPlayer source="/second.cast" options={firstOptions} onPlayerReady={onPlayerReady} />,
    );
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(2));
    expect(first.dispose).toHaveBeenCalledTimes(1);

    view.rerender(
      <AsciinemaPlayer source="/second.cast" options={{ cols: 100 }} onPlayerReady={onPlayerReady} />,
    );
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(3));
    expect(second.dispose).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(third.dispose).toHaveBeenCalledTimes(1);
  });
});
