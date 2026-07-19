import { afterEach, describe, expect, it, vi } from "vitest";
import { createCopyController } from "../src/index.js";

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("copy controller", () => {
  it("copies only the scoped source and restores button feedback", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div data-cf-copy-scope>
        <code data-cf-copy-source>npm run build</code>
        <pre>output must not be copied</pre>
        <button data-cf-copy-button data-copy-label="Copy command" data-copied-label="Copied">
          <span data-cf-copy-label>Copy command</span>
        </button>
        <span data-cf-copy-status></span>
      </div>
    `;
    const writeText = vi.fn(async () => undefined);
    const controller = createCopyController(document, { writeText, copiedDuration: 1000 });
    const button = document.querySelector<HTMLButtonElement>("button")!;

    button.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("npm run build");
    expect(button.dataset.copyState).toBe("copied");
    expect(button.textContent).toContain("Copied");
    expect(document.querySelector("[data-cf-copy-status]")?.textContent).toContain("Copied to clipboard.");

    vi.advanceTimersByTime(1000);
    expect(button.dataset.copyState).toBe("idle");
    expect(button.textContent).toContain("Copy command");

    controller.destroy();
    button.click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("reports an unavailable clipboard without throwing from the event handler", async () => {
    document.body.innerHTML = `
      <div data-cf-copy-scope>
        <code data-cf-copy-source>command</code>
        <button data-cf-copy-button><span data-cf-copy-label>Copy</span></button>
      </div>
    `;
    const controller = createCopyController(document, {
      writeText: async () => Promise.reject(new Error("unavailable")),
    });
    const button = document.querySelector<HTMLButtonElement>("button")!;

    button.click();
    await vi.waitFor(() => expect(button.dataset.copyState).toBe("error"));
    expect(button.textContent).toContain("Try again");
    controller.destroy();
  });
});
