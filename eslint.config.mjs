import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const incompatibleReactRules = Object.fromEntries(
  Object.keys(nextVitals[0]?.rules || {})
    .filter((ruleName) => ruleName.startsWith("react/"))
    .map((ruleName) => [ruleName, "off"])
);

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // eslint-plugin-react bundled by eslint-config-next still calls the
    // removed rule-context getFilename API under ESLint 10 for these rules.
    rules: {
      ...incompatibleReactRules,
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
    "build/**",
    "e2e/**",
    "next-env.d.ts",
    // Local skill/reference folders and one-off scripts outside the shipped app.
    ".agent/**",
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
