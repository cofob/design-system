import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.hoisted(() => vi.fn());

vi.mock("asciinema-player", () => ({ create: createMock }));

import type { Player } from "../src/index.js";
import SvelteHarness from "./SvelteHarness.svelte";

function createPlayer(): Player {
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

afterEach(() => {
  document.body.replaceChildren();
});

describe("Svelte AsciinemaPlayer client lifecycle", () => {
  it("publishes the bindable player and disposes it on cleanup", async () => {
    const player = createPlayer();
    createMock.mockReturnValue(player);
    const target = document.createElement("div");
    document.body.append(target);

    const component = mount(SvelteHarness, {
      target,
      props: { source: "/demo.cast", options: { cols: 80 } },
    });

    await vi.waitFor(() => expect(component.getPlayer()).toBe(player));
    expect(createMock).toHaveBeenCalledWith(
      "/demo.cast",
      target.querySelector("[data-cf-asciinema-player-mount]"),
      expect.objectContaining({ cols: 80, theme: "cofob" }),
    );

    await unmount(component);
    expect(player.dispose).toHaveBeenCalledTimes(1);
  });
});
