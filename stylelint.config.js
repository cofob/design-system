export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["**/dist/**", "**/node_modules/**"],
  rules: {
    "custom-property-pattern": "^cf-[a-z0-9-]+$",
    "selector-class-pattern": ["^(cf|astro)-[a-z0-9_-]+$", { resolveNestedSelectors: true }],
    "no-descending-specificity": null,
    "media-feature-range-notation": null,
  },
};
