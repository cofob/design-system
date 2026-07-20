import { describe, expect, it } from "vitest";
import { terminalColorToCss, tokenizeTerminalOutput } from "../src/index.js";

describe("terminal output presentation", () => {
  it("preserves plain output as one unstyled token", () => {
    expect(tokenizeTerminalOutput("Build complete\n51 pages")).toEqual([
      { value: "Build complete\n51 pages", style: {} },
    ]);
  });

  it("tracks SGR styles, colors, newlines, and individual resets", () => {
    const output = "\u001b[1;31merror\ncontinued\u001b[22;39m plain \u001b[4:3;58:2::1:2:3mnote\u001b[0m";

    expect(tokenizeTerminalOutput(output)).toEqual([
      {
        value: "error\ncontinued",
        style: { bold: true, foreground: { mode: "indexed", index: 1 } },
      },
      { value: " plain ", style: {} },
      {
        value: "note",
        style: {
          underline: "curly",
          underlineColor: { mode: "rgb", red: 1, green: 2, blue: 3 },
        },
      },
    ]);
  });

  it("supports standard, bright, indexed, truecolor, inverse, conceal, and decorations", () => {
    const output =
      "\u001b[44;97;2;3;7;8;9;53mstyled\u001b[0m" + "\u001b[38;5;208mindexed\u001b[48;2;12;34;56mtruecolor";
    const tokens = tokenizeTerminalOutput(output);

    expect(tokens[0]).toEqual({
      value: "styled",
      style: {
        background: { mode: "indexed", index: 4 },
        foreground: { mode: "indexed", index: 15 },
        dim: true,
        italic: true,
        inverse: true,
        concealed: true,
        strikethrough: true,
        overline: true,
      },
    });
    expect(tokens[1]?.style.foreground).toEqual({ mode: "indexed", index: 208 });
    expect(tokens[2]?.style).toMatchObject({
      foreground: { mode: "indexed", index: 208 },
      background: { mode: "rgb", red: 12, green: 34, blue: 56 },
    });
  });

  it("parses safe OSC 8 links and flattens unsafe links to text", () => {
    const output =
      "\u001b]8;id=docs;https://design.cofob.dev\u0007safe\u001b[1m link\u001b]8;;\u001b\\ " +
      "\u001b]8;;javascript:alert(1)\u001b\\unsafe\u001b]8;;\u0007";

    expect(tokenizeTerminalOutput(output)).toEqual([
      { value: "safe", style: {}, href: "https://design.cofob.dev" },
      { value: " link", style: { bold: true }, href: "https://design.cofob.dev" },
      { value: " unsafe", style: { bold: true } },
    ]);
  });

  it("consumes unsupported controls and tolerates malformed sequences", () => {
    expect(tokenizeTerminalOutput("a\u001b[2Jb\u0007c\u0090metadata\u009cd\u001b[31")).toEqual([
      { value: "abcd31", style: {} },
    ]);
  });

  it("converts theme colors, xterm colors, and RGB colors to safe CSS", () => {
    expect(terminalColorToCss({ mode: "indexed", index: 2 })).toBe("var(--cf-terminal-foreground-2)");
    expect(terminalColorToCss({ mode: "indexed", index: 2 }, "background")).toBe(
      "var(--cf-terminal-background-2)",
    );
    expect(terminalColorToCss({ mode: "indexed", index: 208 })).toBe("rgb(255 135 0)");
    expect(terminalColorToCss({ mode: "indexed", index: 244 })).toBe("rgb(128 128 128)");
    expect(terminalColorToCss({ mode: "rgb", red: 12, green: 34, blue: 56 })).toBe("rgb(12 34 56)");
  });
});
