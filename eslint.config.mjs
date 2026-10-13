import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The BAC engine stays pure TypeScript: no UI, framework or database dependency (PLAN §1).
    files: ["lib/bac/**/*.ts", "config/**/*.ts"],
    ignores: ["**/__tests__/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom", "react/*", "next", "next/*"], message: "lib/bac must not depend on the UI." },
            { group: ["@supabase/*", "@/lib/supabase/*"], message: "lib/bac must not depend on the database." },
            { group: ["node:*"], message: "lib/bac must run in the browser and in a Web Worker." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
