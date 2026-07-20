import type { StickerPack } from "./types.js";

export { DEFAULT_STICKER_ASSET_BASE, resolveAnimatedSticker, resolveStickerAsset } from "./shared.js";
export type { AnimatedStickerAsset, AnimatedStickerSourceFormat, StaticStickerAsset, StickerAsset, StickerAssetIndexEntry, StickerAssetKind, StickerPack } from "./types.js";

export const packs = [
  {
    "key": "animated_chris",
    "slug": "animated-chris",
    "componentPrefix": "AnimatedChris",
    "title": "Крис анимированный @stiky",
    "sourceUrl": "https://t.me/addstickers/animated_chris",
    "stickerCount": 37,
    "catalogPath": "animated-chris.json"
  },
  {
    "key": "PhSilver",
    "slug": "ph-silver",
    "componentPrefix": "PhSilver",
    "title": "PhilippSilverFoxPack",
    "sourceUrl": "https://t.me/addstickers/PhSilver",
    "stickerCount": 117,
    "catalogPath": "ph-silver.json"
  },
  {
    "key": "nyyyyyyb_by_fStikBot",
    "slug": "nyyyyyyb",
    "componentPrefix": "Nyyyyyyb",
    "title": "шаурма :: @fStikBot",
    "sourceUrl": "https://t.me/addstickers/nyyyyyyb_by_fStikBot",
    "stickerCount": 34,
    "catalogPath": "nyyyyyyb.json"
  },
  {
    "key": "the_gates_of_orgrimmar",
    "slug": "the-gates-of-orgrimmar",
    "componentPrefix": "TheGatesOfOrgrimmar",
    "title": "Врата Оргриммара",
    "sourceUrl": "https://t.me/addstickers/the_gates_of_orgrimmar",
    "stickerCount": 120,
    "catalogPath": "the-gates-of-orgrimmar.json"
  },
  {
    "key": "FlunkyAll_by_fStikBot",
    "slug": "flunky-all",
    "componentPrefix": "FlunkyAll",
    "title": "Flunky All Stickers :: @fStikBot",
    "sourceUrl": "https://t.me/addstickers/FlunkyAll_by_fStikBot",
    "stickerCount": 50,
    "catalogPath": "flunky-all.json"
  },
  {
    "key": "Cutecatsmeme",
    "slug": "cute-cats-meme",
    "componentPrefix": "CuteCatsMeme",
    "title": "⚞ᴥ⚟  @noona_stickers",
    "sourceUrl": "https://t.me/addstickers/Cutecatsmeme",
    "stickerCount": 120,
    "catalogPath": "cute-cats-meme.json"
  },
  {
    "key": "ManedDerpAnimated",
    "slug": "maned-derp-animated",
    "componentPrefix": "ManedDerpAnimated",
    "title": "Maned Derp Animated",
    "sourceUrl": "https://t.me/addstickers/ManedDerpAnimated",
    "stickerCount": 50,
    "catalogPath": "maned-derp-animated.json"
  },
  {
    "key": "vibe_flag",
    "slug": "vibe-flag",
    "componentPrefix": "VibeFlag",
    "title": "VIBE flag",
    "sourceUrl": "https://t.me/addstickers/vibe_flag",
    "stickerCount": 48,
    "catalogPath": "vibe-flag.json"
  }
] as const satisfies readonly StickerPack[];
