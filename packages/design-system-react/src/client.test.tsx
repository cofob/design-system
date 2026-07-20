import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AnimatedSticker,
  AnimatedStickerToggle,
  CodeBlock,
  Dialog,
  DropdownMenu,
  Popover,
  Tabs,
  TerminalCodeBlock,
  ThemeProvider,
  ToastProvider,
  ToastViewport,
  toast,
  useTheme,
  useToast,
  Tooltip,
} from "./client.js";

describe("client components", () => {
  it("server-renders an inline animated-sticker skeleton without a separate image request", () => {
    const sticker = {
      src: "/stickers/chris.123456789abc.webm",
      skeletonSvg: '<svg viewBox="0 0 512 512"><path d="M0 0h10v10z"/></svg>',
      width: 512,
      height: 512,
    };
    const html = renderToString(<AnimatedSticker sticker={sticker} alt="Animated Chris" />);

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Animated Chris"');
    expect(html).toContain('<span class="cf-animated-sticker__skeleton" aria-hidden="true"><svg');
    expect(html).toContain("<video");
    expect(html).toContain('data-cf-animated-sticker-src="/stickers/chris.123456789abc.webm"');
    expect(html).not.toMatch(/<video[^>]*\ssrc=/u);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("poster=");
    expect(html).not.toContain("data:image");

    const staticHtml = renderToString(
      <AnimatedSticker sticker={sticker} alt="Static Chris" playback="static" />,
    );
    expect(staticHtml).toContain('data-playback="static"');
    expect(staticHtml).toContain('data-state="static"');
    expect(staticHtml).toContain("<svg");
    expect(staticHtml).not.toContain("<video");
  });

  it("server-renders a WebP first frame for video-based stickers", () => {
    const sticker = {
      src: "/stickers/vibe.webm",
      firstFrameSrc: "/stickers/vibe.first-frame.123456789abc.webp",
      width: 192,
      height: 192,
    };
    const html = renderToString(<AnimatedSticker sticker={sticker} alt="Vibe flag" playback="static" />);
    expect(html).toContain('<img src="/stickers/vibe.first-frame.123456789abc.webp"');
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("<video");
  });

  it("controls the global animated sticker flag", async () => {
    const onEnabledChange = vi.fn();
    render(
      <AnimatedStickerToggle
        defaultEnabled={false}
        label="Animated stickers"
        onEnabledChange={onEnabledChange}
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Animated stickers" });
    await waitFor(() => expect(document.documentElement.dataset.cfAnimatedStickers).toBe("disabled"));
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    expect(document.documentElement.dataset.cfAnimatedStickers).toBe("enabled");
    expect(toggle).toBeChecked();
    expect(onEnabledChange).toHaveBeenCalledWith(true);
    expect(onEnabledChange).toHaveBeenCalledTimes(1);
    document.documentElement.removeAttribute("data-cf-animated-stickers");
    localStorage.removeItem("cf-animated-stickers");
  });

  it("hydrates the animated sticker toggle from persisted storage", async () => {
    localStorage.setItem("cf-animated-stickers", "disabled");
    document.documentElement.removeAttribute("data-cf-animated-stickers");
    render(<AnimatedStickerToggle label="Animated stickers" />);

    const toggle = screen.getByRole("switch", { name: "Animated stickers" });
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(document.documentElement.dataset.cfAnimatedStickers).toBe("disabled");
    expect(localStorage.getItem("cf-animated-stickers")).toBe("disabled");
    document.documentElement.removeAttribute("data-cf-animated-stickers");
    localStorage.removeItem("cf-animated-stickers");
  });

  it("shows the copy action by default and allows the toolbar to be disabled", () => {
    const { container, rerender } = render(<CodeBlock code="plain text" />);
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();

    rerender(<CodeBlock code="plain text" language="text" showLanguage={false} copyable={false} />);
    expect(container.querySelector(".cf-code-block__toolbar")).toBeNull();
  });

  it("shows an optional language and copies code or terminal commands without output", async () => {
    const writeText = vi.fn(async () => undefined);
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    try {
      const { container } = render(
        <>
          <CodeBlock code={'const theme = "dark";'} language="typescript" />
          <TerminalCodeBlock
            entries={[
              {
                command: "npm run build",
                output:
                  "\u001b[1;32moutput\u001b[0m <strong>must not be markup</strong> · \u001b]8;;https://design.cofob.dev\u0007report\u001b]8;;\u0007",
              },
            ]}
          />
        </>,
      );

      expect(screen.getByText("typescript")).toHaveClass("cf-code-block__language");
      const command = container.querySelector(".cf-terminal-code-block__command")!;
      expect(command).toHaveTextContent(/^npm run build$/);
      expect(command.querySelector('[data-token="command"]')).toHaveTextContent("npm");
      expect(container.querySelector(".cf-terminal-code-block__output .cf-syntax-token")).toBeNull();
      expect(container.querySelector('.cf-terminal-output__token[data-bold="true"]')).toHaveTextContent(
        "output",
      );
      expect(container.querySelector(".cf-terminal-code-block__output")).not.toHaveTextContent("\u001b");
      expect(container.querySelector(".cf-terminal-code-block__output strong")).toBeNull();
      expect(container.querySelector(".cf-terminal-code-block__output")).toHaveTextContent(
        "<strong>must not be markup</strong>",
      );
      expect(screen.getByRole("link", { name: "report" })).toHaveAttribute(
        "href",
        "https://design.cofob.dev",
      );
      expect(screen.getByRole("link", { name: "report" })).toHaveAttribute("target", "_blank");
      expect(screen.getByRole("link", { name: "report" })).toHaveAttribute("rel", "noopener noreferrer");
      fireEvent.click(screen.getByRole("button", { name: "Copy typescript code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('const theme = "dark";'));
      expect(screen.getByRole("button", { name: "Code copied to clipboard" })).toHaveTextContent("Copied");

      fireEvent.click(screen.getByRole("button", { name: "Copy command 1" }));
      await waitFor(() => expect(writeText).toHaveBeenLastCalledWith("npm run build"));
      expect(writeText).not.toHaveBeenCalledWith(expect.stringContaining("output"));
    } finally {
      if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("resolves a controlled theme preference during SSR", () => {
    function ThemeProbe() {
      const theme = useTheme();
      return <span data-preference={theme.preference} data-resolved-theme={theme.resolvedTheme} />;
    }

    const html = renderToString(
      <ThemeProvider preference="dark">
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(html).toContain('data-preference="dark"');
    expect(html).toContain('data-resolved-theme="dark"');
  });

  it("hydrates an uncontrolled theme from storage without overwriting it", async () => {
    function ThemeProbe() {
      const theme = useTheme();
      return <span data-testid="theme-probe" data-preference={theme.preference} />;
    }

    const values = new Map<string, string>([["cf-theme", "dark"]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const originalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    try {
      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );

      await waitFor(() =>
        expect(screen.getByTestId("theme-probe")).toHaveAttribute("data-preference", "dark"),
      );
      expect(storage.getItem("cf-theme")).toBe("dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
    } finally {
      if (originalStorage) Object.defineProperty(window, "localStorage", originalStorage);
      else Reflect.deleteProperty(window, "localStorage");
      delete document.documentElement.dataset.theme;
      delete document.documentElement.dataset.themePreference;
      document.documentElement.style.colorScheme = "";
    }
  });

  it("supports uncontrolled tabs and keyboard navigation", () => {
    render(
      <Tabs
        items={[
          { id: "first", label: "First", content: "One" },
          { id: "second", label: "Second", content: "Two" },
        ]}
      />,
    );
    const first = screen.getByRole("tab", { name: "First" });
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute("aria-selected", "true");
  });

  it("reports controlled accordion changes", () => {
    const onValueChange = vi.fn();
    render(
      <Accordion
        value={[]}
        onValueChange={onValueChange}
        items={[{ id: "a", heading: "Question", content: "Answer" }]}
      />,
    );
    fireEvent.click(screen.getByText("Question"));
    expect(onValueChange).toHaveBeenCalledWith(["a"]);
  });

  it("supports manual tabs and accordion focus navigation", () => {
    render(
      <>
        <Tabs
          activation="manual"
          items={[
            { id: "first", label: "First tab", content: "One" },
            { id: "second", label: "Second tab", content: "Two" },
          ]}
        />
        <Accordion
          items={[
            { id: "first", heading: "First question", content: "One" },
            { id: "disabled", heading: "Disabled question", content: "No", disabled: true },
            { id: "last", heading: "Last question", content: "Two" },
          ]}
        />
      </>,
    );

    const firstTab = screen.getByRole("tab", { name: "First tab" });
    const secondTab = screen.getByRole("tab", { name: "Second tab" });
    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    expect(secondTab).toHaveFocus();
    expect(firstTab).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(secondTab, { key: "Enter" });
    expect(secondTab).toHaveAttribute("aria-selected", "true");

    const firstSummary = screen.getByText("First question");
    const lastSummary = screen.getByText("Last question");
    firstSummary.focus();
    fireEvent.keyDown(firstSummary, { key: "ArrowDown" });
    expect(lastSummary).toHaveFocus();
    fireEvent.keyDown(lastSummary, { key: "Home" });
    expect(firstSummary).toHaveFocus();
  });

  it("clones interactive triggers, preserves callbacks, and exposes fallback popover state", () => {
    const dialogClick = vi.fn();
    const popoverClick = vi.fn();
    const { container } = render(
      <>
        <Dialog title="Safe dialog" trigger={<button onClick={dialogClick}>Open dialog</button>}>
          Dialog body
        </Dialog>
        <Popover trigger={<button onClick={popoverClick}>Open popover</button>}>Popover body</Popover>
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(dialogClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    expect(popoverClick).toHaveBeenCalledOnce();
    const popover = container.querySelector<HTMLElement>(".cf-popover");
    expect(popover).toHaveAttribute("data-cf-fallback-open", "true");
    expect(popover).not.toHaveAttribute("hidden");
    expect(container.querySelector("button button")).toBeNull();
  });

  it("matches the native dialog structure and delegates delayed/click tooltips to the controller", () => {
    vi.useFakeTimers();
    const { container } = render(
      <>
        <Dialog title="Confirm" description="Review this" trigger="Open dialog">
          Body
        </Dialog>
        <Tooltip content="More information">
          <button type="button">Help</button>
        </Tooltip>
      </>,
    );

    expect(container.querySelector(".cf-dialog__header > div > .cf-dialog__description")).toHaveTextContent(
      "Review this",
    );
    expect(container.querySelector(".cf-dialog__close > [aria-hidden='true']")).toHaveTextContent("×");

    const help = screen.getByRole("button", { name: "Help" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    fireEvent.mouseEnter(help);
    act(() => vi.advanceTimersByTime(999));
    expect(tooltip).toHaveAttribute("data-state", "closed");
    act(() => vi.advanceTimersByTime(1));
    expect(tooltip).toHaveAttribute("data-state", "open");
    fireEvent.mouseLeave(help);
    expect(tooltip).toHaveAttribute("data-state", "closed");
    fireEvent.click(help);
    expect(tooltip).toHaveAttribute("data-state", "open");
    fireEvent.click(help);
    expect(tooltip).toHaveAttribute("data-state", "closed");
    vi.useRealTimers();
  });

  it("uses the shared button contract only for generated string triggers", () => {
    render(
      <>
        <Dialog title="Generated dialog" trigger="Open generated dialog">
          Body
        </Dialog>
        <Popover trigger="Open generated popover">Body</Popover>
        <DropdownMenu trigger="Open generated menu" items={[{ id: "item", label: "Menu item" }]} />
        <Popover trigger={<button className="consumer-trigger">Consumer trigger</button>}>Body</Popover>
      </>,
    );

    for (const name of ["Open generated dialog", "Open generated popover", "Open generated menu"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("cf-button");
      expect(screen.getByRole("button", { name })).toHaveAttribute("data-variant", "secondary");
    }
    expect(screen.getByRole("button", { name: "Consumer trigger" })).toHaveClass("consumer-trigger");
    expect(screen.getByRole("button", { name: "Consumer trigger" })).not.toHaveClass("cf-button");
  });

  it("uses roving menu focus, composes key handlers, and returns focus on Escape", async () => {
    const triggerClick = vi.fn();
    const menuKeyDown = vi.fn();
    const { container } = render(
      <DropdownMenu
        trigger={<button onClick={triggerClick}>Actions</button>}
        onKeyDown={menuKeyDown}
        items={[
          { id: "alpha", label: "Alpha" },
          { id: "disabled", label: "Disabled", disabled: true },
          { id: "beta", label: "Beta" },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });
    fireEvent.click(trigger);
    expect(triggerClick).toHaveBeenCalledOnce();
    await act(() => Promise.resolve());

    const menu = screen.getByRole("menu");
    const alpha = screen.getByRole("menuitem", { name: "Alpha" });
    const beta = screen.getByRole("menuitem", { name: "Beta" });
    expect(menu).toHaveAttribute("data-cf-fallback-open", "true");
    expect(alpha).toHaveAttribute("tabindex", "0");
    expect(beta).toHaveAttribute("tabindex", "-1");
    expect(alpha).toHaveFocus();

    fireEvent.keyDown(alpha, { key: "ArrowDown" });
    expect(menuKeyDown).toHaveBeenCalled();
    expect(beta).toHaveFocus();
    expect(alpha).toHaveAttribute("tabindex", "-1");
    expect(beta).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(beta, { key: "Escape" });
    await act(() => Promise.resolve());
    expect(trigger).toHaveFocus();
    expect(menu).toHaveAttribute("hidden");
    expect(container.querySelector("button button")).toBeNull();
  });

  it("provides a toast API and live viewport", () => {
    function AddToast() {
      const api = useToast();
      return <button onClick={() => api.toast({ title: "Saved", duration: 0 })}>Notify</button>;
    }
    render(
      <ToastProvider>
        <AddToast />
        <ToastViewport />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("returns toast IDs, replaces timers, runs actions, and cleans up on unmount", () => {
    vi.useFakeTimers();
    const action = vi.fn();
    const view = render(
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>,
    );

    let returnedId = "";
    act(() => {
      returnedId = toast({
        id: "stable-toast",
        title: "First",
        duration: 1000,
        action: { label: "Undo", onClick: action },
      });
    });
    expect(returnedId).toBe("stable-toast");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByText("First")).not.toBeInTheDocument();

    act(() => {
      toast({ id: "replace-me", title: "Older", duration: 1000 });
      vi.advanceTimersByTime(500);
      toast({ id: "replace-me", title: "Newer", duration: 1000 });
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText("Newer")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(501));
    expect(screen.queryByText("Newer")).not.toBeInTheDocument();

    act(() => {
      toast({ title: "Pending", duration: 5000 });
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
