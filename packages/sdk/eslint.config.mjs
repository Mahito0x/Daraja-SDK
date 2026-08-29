import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["dist/**", ".tmp-pack/**", "coverage/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2024,
        AbortController: "readonly",
        AbortSignal: "readonly",
        Buffer: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        btoa: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
    },
  },
]);
