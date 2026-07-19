import type { BashToken, BashTokenKind } from "./types.js";

const operators = ["&&", "||", ">>", "<<", "&>", "2>", "|", ";", ">", "<", "&", "(", ")"] as const;
const commandPrefixes = new Set(["command", "env", "exec", "sudo", "time", "xargs"]);

function append(tokens: BashToken[], kind: BashTokenKind, value: string): void {
  if (!value) return;
  const previous = tokens.at(-1);
  if (previous?.kind === kind) previous.value += value;
  else tokens.push({ kind, value });
}

function readQuoted(source: string, start: number): number {
  const quote = source[start];
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === "\\" && quote === '"') index += 2;
    else if (source[index] === quote) return index + 1;
    else index += 1;
  }
  return source.length;
}

function readVariable(source: string, start: number): number {
  if (source[start + 1] === "{") {
    const end = source.indexOf("}", start + 2);
    return end === -1 ? source.length : end + 1;
  }
  if (source[start + 1] === "(") {
    let depth = 1;
    let index = start + 2;
    while (index < source.length && depth > 0) {
      if (source[index] === "(") depth += 1;
      if (source[index] === ")") depth -= 1;
      index += 1;
    }
    return index;
  }
  const match = source.slice(start + 1).match(/^(?:[A-Za-z_][A-Za-z0-9_]*|[0-9]+|[?#@*!$-])/);
  return match ? start + 1 + match[0].length : start + 1;
}

/** Tokenizes a Bash command for presentation while preserving its exact text content. */
export function tokenizeBashCommand(source: string): BashToken[] {
  const tokens: BashToken[] = [];
  let index = 0;
  let expectsCommand = true;

  while (index < source.length) {
    const whitespace = source.slice(index).match(/^\s+/)?.[0];
    if (whitespace) {
      append(tokens, "plain", whitespace);
      if (whitespace.includes("\n")) expectsCommand = true;
      index += whitespace.length;
      continue;
    }

    const character = source[index];
    const previous = source[index - 1] ?? "";
    if (character === "#" && (index === 0 || /\s|[;|&()]/.test(previous))) {
      const newline = source.indexOf("\n", index);
      const end = newline === -1 ? source.length : newline;
      append(tokens, "comment", source.slice(index, end));
      index = end;
      continue;
    }

    if (character === '"' || character === "'") {
      const end = readQuoted(source, index);
      const followsAssignment = tokens.at(-1)?.kind === "variable" && tokens.at(-1)?.value.endsWith("=");
      append(tokens, "string", source.slice(index, end));
      if (!followsAssignment) expectsCommand = false;
      index = end;
      continue;
    }

    if (character === "$") {
      const end = readVariable(source, index);
      append(tokens, "variable", source.slice(index, end));
      expectsCommand = false;
      index = end;
      continue;
    }

    const operator = operators.find((candidate) => source.startsWith(candidate, index));
    if (operator) {
      append(tokens, "operator", operator);
      if (["&&", "||", "|", ";", "&", "("].includes(operator)) expectsCommand = true;
      index += operator.length;
      continue;
    }

    let end = index + 1;
    while (end < source.length && !/\s|["'$;|&()<>]/.test(source[end] ?? "")) end += 1;
    const value = source.slice(index, end);

    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(value)) {
      append(tokens, "variable", value);
    } else if (expectsCommand && value.startsWith("-")) {
      append(tokens, "option", value);
    } else if (expectsCommand) {
      append(tokens, "command", value);
      expectsCommand = commandPrefixes.has(value);
    } else if (value.startsWith("-")) {
      append(tokens, "option", value);
    } else if (/^\d+(?:\.\d+)?$/.test(value)) {
      append(tokens, "number", value);
    } else {
      append(tokens, "plain", value);
    }
    index = end;
  }

  return tokens;
}
