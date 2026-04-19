import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local skill/reference folders and one-off scripts outside the shipped app.
    ".antigravity/**",
    ".cursor/**",
    "create-e2e-users.js",
    "signup-dummy.mjs",
    ".stitch*",
    "*.mjs",
  ]),
]);

export default eslintConfig;
