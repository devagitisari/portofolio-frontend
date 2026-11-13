import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Portfolio images come from external hosts (Cloudinary, picsum, …) and
      // `next/image` is configured with `unoptimized: true` in next.config.ts,
      // so the <img> element gives the exact same result without the wrapper.
      "@next/next/no-img-element": "off",

      // The Material Symbols icon font is loaded through a <link> tag on
      // purpose (see src/app/layout.tsx) — it is an icon font, not a text font.
      "@next/next/no-page-custom-font": "off",
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
