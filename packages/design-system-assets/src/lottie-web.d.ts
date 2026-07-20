declare module "lottie-web/build/player/lottie_svg.js" {
  interface AnimationItem {
    addEventListener(name: "DOMLoaded" | "data_failed", listener: () => void): void;
    destroy(): void;
    goToAndStop(frame: number, isFrame: boolean): void;
  }

  interface LottieSvgPlayer {
    loadAnimation(options: {
      animationData: Record<string, unknown>;
      autoplay: boolean;
      container: Element;
      loop: boolean;
      renderer: "svg";
      rendererSettings: { preserveAspectRatio: string };
    }): AnimationItem;
  }

  const player: LottieSvgPlayer;
  export default player;
}
