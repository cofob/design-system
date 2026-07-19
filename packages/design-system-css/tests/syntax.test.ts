import { describe, expect, it } from "vitest";
import { tokenizeBashCommand } from "../src/index.js";

describe("Bash syntax presentation", () => {
  it("preserves the command exactly while classifying useful shell tokens", () => {
    const command = 'FOO="hello world" npm run build -- --mode production && echo "$FOO" # done';
    const tokens = tokenizeBashCommand(command);

    expect(tokens.map((token) => token.value).join("")).toBe(command);
    expect(tokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "variable", value: "FOO=" }),
        expect.objectContaining({ kind: "string", value: '"hello world"' }),
        expect.objectContaining({ kind: "command", value: "npm" }),
        expect.objectContaining({ kind: "option", value: "--mode" }),
        expect.objectContaining({ kind: "operator", value: "&&" }),
        expect.objectContaining({ kind: "command", value: "echo" }),
        expect.objectContaining({ kind: "comment", value: "# done" }),
      ]),
    );
  });

  it("recognizes a command after common prefixes and pipes", () => {
    const command = "sudo rg --files | head -n 3";
    const tokens = tokenizeBashCommand(command);
    const commands = tokens.filter((token) => token.kind === "command").map((token) => token.value);

    expect(commands).toEqual(["sudo", "rg", "head"]);
    expect(tokens.map((token) => token.value).join("")).toBe(command);
  });
});
