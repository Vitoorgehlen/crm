module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    node: true,
    es2021: true,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "no-console": "off",
    "no-multiple-empty-lines": ["error", { max: 1 }],
    "no-trailing-spaces": "error",
    semi: ["error", "always"],
    "object-curly-spacing": ["error", "always"],
    indent: ["error", 2, { SwitchCase: 1 }],
    "space-before-blocks": "error",
    "comma-spacing": ["error", { before: false, after: true }],
    "@typescript-eslint/no-unused-vars": ["warn"],
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
