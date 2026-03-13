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
    // Worker packages managed separately
    "workers/**",
  ]),
  {
    rules: {
      // Inline styles are intentional in admin UI (dynamic values) and Remotion compositions
      "react/forbid-component-props": "off",
      "no-inline-styles": "off",
      // Tailwind canonical class suggestions are informational only
      "tailwindcss/no-arbitrary-value": "off",
      // Relax some a11y rules for internal admin-only tooling
      "jsx-a11y/no-autofocus": "off",
    },
  },
]);

export default eslintConfig;
