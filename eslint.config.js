import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.astro/**",
      "**/.svelte-kit/**",
      "**/*.svelte",
      "**/*.astro",
      "playwright-report/**",
      "test-results/**",
      "packages/design-system-stickers/.cache/**",
      "packages/design-system-stickers/src/generated/**",
      "packages/design-system-stickers/src/react/generated/**",
      "packages/design-system-stickers/src/index.ts",
      "packages/design-system-stickers/src/react/index.tsx",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.flat.recommended.rules,
  },
);
