import { JSDOM } from "jsdom";
import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { optimize } from "svgo";

import type { TgsAnimationData } from "./tgs.js";

const FORBIDDEN_ELEMENTS = "script,foreignObject,image,audio,video,iframe,object,embed,a";
let renderQueue: Promise<void> = Promise.resolve();

function installCanvas(window: JSDOM["window"]): void {
  const backingCanvases = new WeakMap<HTMLCanvasElement, Canvas>();
  Object.defineProperty(window.HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value(this: HTMLCanvasElement, contextId: string) {
      if (contextId !== "2d") return null;
      let canvas = backingCanvases.get(this);
      if (!canvas || canvas.width !== this.width || canvas.height !== this.height) {
        canvas = createCanvas(this.width || 300, this.height || 150);
        backingCanvases.set(this, canvas);
      }
      return canvas.getContext("2d");
    },
  });
}

function installDomGlobals(window: JSDOM["window"]): () => void {
  const values: Record<string, unknown> = {
    window,
    document: window.document,
    navigator: window.navigator,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    SVGElement: window.SVGElement,
    Node: window.Node,
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  return () => {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  };
}

function safeUrlReferences(value: string): boolean {
  for (const match of value.matchAll(/url\((['"]?)(.*?)\1\)/giu)) {
    if (!match[2]?.trim().startsWith("#")) return false;
  }
  return true;
}

function sanitizeSvg(
  svg: SVGSVGElement,
  viewBoxWidth: number,
  viewBoxHeight: number,
  width: number,
  height: number,
): string {
  for (const element of svg.querySelectorAll(FORBIDDEN_ELEMENTS)) element.remove();
  for (const element of [svg, ...svg.querySelectorAll("*")]) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (
        name.startsWith("on") ||
        name === "xml:base" ||
        ((name === "href" || name === "xlink:href") && !value.startsWith("#")) ||
        !safeUrlReferences(value) ||
        /(?:javascript:|@import|expression\s*\(|https?:|data:|\/\/)/iu.test(value)
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.removeAttribute("role");

  const result = optimize(svg.outerHTML, {
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: { overrides: { removeUnknownsAndDefaults: false } },
      },
    ],
  });
  if (
    /<(?:script|foreignObject|image|audio|video|iframe|object|embed|a)\b|\son\w+=|(?:javascript:|data:)|url\((?!['"]?#)|(?:href|xlink:href)=["'](?!#)/iu.test(
      result.data,
    )
  ) {
    throw new Error("Generated first-frame SVG did not pass the safety check.");
  }
  return result.data;
}

async function render(animationData: TgsAnimationData, width: number, height: number): Promise<string> {
  const dom = new JSDOM("<!doctype html><html><body><div id=container></div></body></html>", {
    pretendToBeVisual: true,
  });
  Object.defineProperty(dom.window.document, "readyState", {
    configurable: true,
    get: () => "complete",
  });
  installCanvas(dom.window);
  const restoreGlobals = installDomGlobals(dom.window);
  let animation:
    | {
        addEventListener(name: "DOMLoaded" | "data_failed", listener: () => void): void;
        destroy(): void;
        goToAndStop(frame: number, isFrame: boolean): void;
      }
    | undefined;
  try {
    const { default: lottie } = await import("lottie-web/build/player/lottie_svg.js");
    // lottie-web starts one module-level readiness interval. Let it observe the
    // complete document and clear itself before the temporary DOM is removed.
    await new Promise((resolve) => setTimeout(resolve, 110));
    const container = dom.window.document.querySelector("#container");
    if (!container) throw new Error("Could not create the SVG render container.");

    animation = lottie.loadAnimation({
      animationData: structuredClone(animationData),
      autoplay: false,
      container,
      loop: false,
      renderer: "svg",
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Timed out while rendering the first TGS frame.")),
        10_000,
      );
      animation?.addEventListener("DOMLoaded", () => {
        clearTimeout(timeout);
        resolve();
      });
      animation?.addEventListener("data_failed", () => {
        clearTimeout(timeout);
        reject(new Error("Lottie could not render the TGS payload."));
      });
    });
    animation.goToAndStop(0, true);
    const svg = container.querySelector<SVGSVGElement>("svg");
    if (!svg) throw new Error("Lottie did not produce an SVG for the first TGS frame.");
    return sanitizeSvg(svg, animationData.w, animationData.h, width, height);
  } finally {
    animation?.destroy();
    restoreGlobals();
    dom.window.close();
  }
}

export function renderFirstFrameSvg(
  animationData: TgsAnimationData,
  dimensions: { width: number; height: number } = {
    width: animationData.w,
    height: animationData.h,
  },
): Promise<string> {
  const result = renderQueue.then(() => render(animationData, dimensions.width, dimensions.height));
  renderQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
