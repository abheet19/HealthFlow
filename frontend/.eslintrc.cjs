module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "vite.config.ts", "node_modules"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["react-refresh"],
  rules: {
    // Context providers intentionally export both the component and a
    // useXyz() hook from the same file (PatientContext, ToastContext) -
    // that pattern is deliberate here, not an oversight.
    "react-refresh/only-export-components": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-empty": ["warn", { allowEmptyCatch: true }],
  },
};
