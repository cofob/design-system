import type {
  TerminalColor,
  TerminalOutputToken,
  TerminalTextStyle,
  TerminalUnderlineStyle,
} from "./types.js";

type TerminalColorUsage = "foreground" | "background";

const ESCAPE = "\u001b";
const BELL = "\u0007";
const DEVICE_CONTROL_STRING = "\u0090";
const CSI = "\u009b";
const OSC = "\u009d";
const START_OF_STRING = "\u0098";
const PRIVACY_MESSAGE = "\u009e";
const APPLICATION_PROGRAM_COMMAND = "\u009f";
const STRING_TERMINATOR = "\u009c";
const STRING_CONTROLS = new Set([
  DEVICE_CONTROL_STRING,
  START_OF_STRING,
  PRIVACY_MESSAGE,
  APPLICATION_PROGRAM_COMMAND,
]);

function stripControlCharacters(value: string): string {
  return [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && (code < 127 || code > 159));
    })
    .join("");
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function indexed(index: number): TerminalColor | undefined {
  return Number.isInteger(index) && index >= 0 && index <= 255 ? { mode: "indexed", index } : undefined;
}

function rgb(red: number, green: number, blue: number): TerminalColor | undefined {
  return [red, green, blue].every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)
    ? { mode: "rgb", red, green, blue }
    : undefined;
}

function colorsEqual(left: TerminalColor | undefined, right: TerminalColor | undefined): boolean {
  if (left === right) return true;
  if (!left || !right || left.mode !== right.mode) return false;
  if (left.mode === "indexed" && right.mode === "indexed") return left.index === right.index;
  return (
    left.mode === "rgb" &&
    right.mode === "rgb" &&
    left.red === right.red &&
    left.green === right.green &&
    left.blue === right.blue
  );
}

function stylesEqual(left: TerminalTextStyle, right: TerminalTextStyle): boolean {
  return (
    colorsEqual(left.foreground, right.foreground) &&
    colorsEqual(left.background, right.background) &&
    colorsEqual(left.underlineColor, right.underlineColor) &&
    left.bold === right.bold &&
    left.dim === right.dim &&
    left.italic === right.italic &&
    left.underline === right.underline &&
    left.inverse === right.inverse &&
    left.concealed === right.concealed &&
    left.strikethrough === right.strikethrough &&
    left.overline === right.overline
  );
}

function appendToken(
  tokens: TerminalOutputToken[],
  value: string,
  style: TerminalTextStyle,
  href: string | undefined,
): void {
  const printable = stripControlCharacters(value);
  if (!printable) return;
  const previous = tokens.at(-1);
  if (previous && previous.href === href && stylesEqual(previous.style, style)) {
    previous.value += printable;
    return;
  }
  tokens.push({ value: printable, style: { ...style }, ...(href ? { href } : {}) });
}

function parseInteger(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d+$/.test(value)) return undefined;
  return Number.parseInt(value, 10);
}

function setColor(style: TerminalTextStyle, code: number, color: TerminalColor | undefined): void {
  if (!color) return;
  if (code === 38) style.foreground = color;
  else if (code === 48) style.background = color;
  else style.underlineColor = color;
}

function parseColonColor(parts: readonly string[]): TerminalColor | undefined {
  const mode = parseInteger(parts[0]);
  if (mode === 5) return indexed(parseInteger(parts[1]) ?? -1);
  if (mode !== 2 || parts.length < 4) return undefined;
  const channels = parts.slice(-3).map((part) => parseInteger(part));
  if (channels.some((channel) => channel === undefined)) return undefined;
  return rgb(channels[0]!, channels[1]!, channels[2]!);
}

function resetStyle(style: TerminalTextStyle): void {
  for (const key of Object.keys(style) as (keyof TerminalTextStyle)[]) delete style[key];
}

function applySimpleSgr(style: TerminalTextStyle, code: number): void {
  if (code === 0) resetStyle(style);
  else if (code === 1) style.bold = true;
  else if (code === 2) style.dim = true;
  else if (code === 3) style.italic = true;
  else if (code === 4) style.underline = "single";
  else if (code === 7) style.inverse = true;
  else if (code === 8) style.concealed = true;
  else if (code === 9) style.strikethrough = true;
  else if (code === 21) style.underline = "double";
  else if (code === 22) {
    delete style.bold;
    delete style.dim;
  } else if (code === 23) delete style.italic;
  else if (code === 24) delete style.underline;
  else if (code === 27) delete style.inverse;
  else if (code === 28) delete style.concealed;
  else if (code === 29) delete style.strikethrough;
  else if (code >= 30 && code <= 37) style.foreground = { mode: "indexed", index: code - 30 };
  else if (code === 39) delete style.foreground;
  else if (code >= 40 && code <= 47) style.background = { mode: "indexed", index: code - 40 };
  else if (code === 49) delete style.background;
  else if (code === 53) style.overline = true;
  else if (code === 55) delete style.overline;
  else if (code === 59) delete style.underlineColor;
  else if (code >= 90 && code <= 97) style.foreground = { mode: "indexed", index: code - 90 + 8 };
  else if (code >= 100 && code <= 107) style.background = { mode: "indexed", index: code - 100 + 8 };
}

function parseUnderlineStyle(value: string | undefined): TerminalUnderlineStyle | undefined {
  if (value === "1") return "single";
  if (value === "2") return "double";
  if (value === "3") return "curly";
  if (value === "4") return "dotted";
  if (value === "5") return "dashed";
  return undefined;
}

function applySgr(style: TerminalTextStyle, parameters: string): void {
  const groups = parameters === "" ? ["0"] : parameters.split(";");
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index] ?? "";
    if (group.includes(":")) {
      const [rawCode = "", ...parts] = group.split(":");
      const code = parseInteger(rawCode || "0");
      if (code === 4) {
        if (parts[0] === "0") delete style.underline;
        else {
          const underline = parseUnderlineStyle(parts[0]);
          if (underline) style.underline = underline;
        }
      } else if (code === 38 || code === 48 || code === 58) {
        setColor(style, code, parseColonColor(parts));
      } else if (code !== undefined) applySimpleSgr(style, code);
      continue;
    }

    const code = parseInteger(group || "0");
    if (code === undefined) continue;
    if (code === 38 || code === 48 || code === 58) {
      const mode = parseInteger(groups[index + 1]);
      if (mode === 5) {
        const color = indexed(parseInteger(groups[index + 2]) ?? -1);
        if (color) {
          setColor(style, code, color);
          index += 2;
        }
      } else if (mode === 2) {
        const color = rgb(
          parseInteger(groups[index + 2]) ?? -1,
          parseInteger(groups[index + 3]) ?? -1,
          parseInteger(groups[index + 4]) ?? -1,
        );
        if (color) {
          setColor(style, code, color);
          index += 4;
        }
      }
      continue;
    }
    applySimpleSgr(style, code);
  }
}

function findCsiEnd(source: string, start: number): number {
  for (let index = start; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    if (code >= 0x40 && code <= 0x7e) return index;
  }
  return -1;
}

interface StringEnd {
  contentEnd: number;
  sequenceEnd: number;
}

function findStringEnd(source: string, start: number, allowsBell: boolean): StringEnd | undefined {
  for (let index = start; index < source.length; index += 1) {
    if (allowsBell && source[index] === BELL) return { contentEnd: index, sequenceEnd: index + 1 };
    if (source[index] === STRING_TERMINATOR) return { contentEnd: index, sequenceEnd: index + 1 };
    if (source[index] === ESCAPE && source[index + 1] === "\\") {
      return { contentEnd: index, sequenceEnd: index + 2 };
    }
  }
  return undefined;
}

function safeHyperlink(value: string): string | undefined {
  if (!value || [...value].some((character) => character.charCodeAt(0) <= 32 || character === "\u007f")) {
    return undefined;
  }
  return /^(?:https?:|mailto:)/i.test(value) ? value : undefined;
}

function nextControl(source: string, start: number): number {
  for (let index = start; index < source.length; index += 1) {
    const character = source[index] ?? "";
    if (character === ESCAPE || character === CSI || character === OSC || STRING_CONTROLS.has(character)) {
      return index;
    }
  }
  return source.length;
}

/**
 * Tokenizes static terminal output while preserving printable text and active ANSI presentation state.
 * Screen-oriented controls are consumed but deliberately not emulated.
 */
export function tokenizeTerminalOutput(source: string): TerminalOutputToken[] {
  const tokens: TerminalOutputToken[] = [];
  const style: TerminalTextStyle = {};
  let href: string | undefined;
  let index = 0;

  while (index < source.length) {
    const control = nextControl(source, index);
    appendToken(tokens, source.slice(index, control), style, href);
    if (control >= source.length) break;

    const marker = source[control];
    const next = source[control + 1];
    const csiStart = marker === CSI ? control + 1 : marker === ESCAPE && next === "[" ? control + 2 : -1;
    if (csiStart >= 0) {
      const end = findCsiEnd(source, csiStart);
      if (end === -1) {
        index = csiStart;
        continue;
      }
      if (source[end] === "m") applySgr(style, source.slice(csiStart, end));
      index = end + 1;
      continue;
    }

    const oscStart = marker === OSC ? control + 1 : marker === ESCAPE && next === "]" ? control + 2 : -1;
    if (oscStart >= 0) {
      const end = findStringEnd(source, oscStart, true);
      if (!end) {
        index = oscStart;
        continue;
      }
      const payload = source.slice(oscStart, end.contentEnd);
      if (payload.startsWith("8;")) {
        const uriSeparator = payload.indexOf(";", 2);
        if (uriSeparator >= 0) {
          const uri = payload.slice(uriSeparator + 1);
          href = uri ? safeHyperlink(uri) : undefined;
        }
      }
      index = end.sequenceEnd;
      continue;
    }

    if (STRING_CONTROLS.has(marker ?? "")) {
      const end = findStringEnd(source, control + 1, false);
      index = end?.sequenceEnd ?? control + 1;
      continue;
    }

    if (marker === ESCAPE && next && "]P^_X".includes(next)) {
      const end = findStringEnd(source, control + 2, false);
      index = end?.sequenceEnd ?? control + 2;
      continue;
    }

    index = marker === ESCAPE && next ? control + 2 : control + 1;
  }

  return tokens;
}

/** Converts a parsed terminal color to a safe CSS color value. */
export function terminalColorToCss(color: TerminalColor, usage: TerminalColorUsage = "foreground"): string {
  if (color.mode === "rgb") {
    return `rgb(${clampByte(color.red)} ${clampByte(color.green)} ${clampByte(color.blue)})`;
  }

  const index = clampByte(color.index);
  if (index < 16) return `var(--cf-terminal-${usage}-${index})`;
  if (index >= 232) {
    const level = 8 + (index - 232) * 10;
    return `rgb(${level} ${level} ${level})`;
  }

  const cubeIndex = index - 16;
  const levels = [0, 95, 135, 175, 215, 255] as const;
  const red = levels[Math.floor(cubeIndex / 36)]!;
  const green = levels[Math.floor((cubeIndex % 36) / 6)]!;
  const blue = levels[cubeIndex % 6]!;
  return `rgb(${red} ${green} ${blue})`;
}
