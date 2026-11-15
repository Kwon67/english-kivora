import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // These React Compiler lint rules flag existing synchronization patterns
      // across the app. Keep them off until those flows are refactored together.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "output/**",
    "build/**",
    "e2e/**",
    "next-env.d.ts",
    // Local skill/reference folders and one-off scripts outside the shipped app.
    ".agent/**",
    ".claude/**",
    ".antigravity/**",
    ".cursor/**",
    "skills/**",
    "create-e2e-users.js",
    "signup-dummy.mjs",
    ".stitch*",
    "*.mjs",
  ]),
]);

export default eslintConfig;
