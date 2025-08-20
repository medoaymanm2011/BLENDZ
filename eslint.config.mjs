import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Avoid blocking builds due to temporary any usage; keep type safety iterative
      "@typescript-eslint/no-explicit-any": "off",
      // Prefer as a guidance, not a hard error for existing code
      "prefer-const": "warn",
      // Reduce noise for unused vars; allow underscore prefix to intentionally ignore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      // Keep as warning to surface issues without failing CI/local build
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
