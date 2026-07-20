// @vitest-environment node

import { render } from "svelte/server";
import { describe, expect, it, vi } from "vitest";

const createMock = vi.hoisted(() => vi.fn());

vi.mock("asciinema-player", () => ({ create: createMock }));

import { AsciinemaPlayer } from "../src/svelte/index.js";

describe("Svelte AsciinemaPlayer", () => {
  it("server-renders the same accessible fallback without browser work", () => {
    const { body } = render(AsciinemaPlayer, {
      props: {
        source: "/demo.cast",
        label: "Deploy walkthrough",
        fallbackHref: "/player/demo",
        labels: { fallbackLink: "Open player" },
      },
    });

    expect(body).toContain("cf-asciinema-player");
    expect(body).toContain('aria-label="Deploy walkthrough"');
    expect(body).toContain('data-state="loading"');
    expect(body).toContain('href="/player/demo"');
    expect(body).toContain("Open player");
    expect(createMock).not.toHaveBeenCalled();
  });
});
