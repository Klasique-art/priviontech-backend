import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
export default [
  { ignores:[".next/**","admin/dist/**","node_modules/**","prisma/migrations/**","next-env.d.ts"] },
  { files:["**/*.{ts,tsx}"],languageOptions:{parser,parserOptions:{ecmaVersion:"latest",sourceType:"module",ecmaFeatures:{jsx:true}}},
    plugins:{"@typescript-eslint":tseslint},rules:{...tseslint.configs.recommended.rules,"@typescript-eslint/no-explicit-any":"off","@typescript-eslint/no-namespace":"off","@typescript-eslint/no-unused-vars":["error",{"argsIgnorePattern":"^_","varsIgnorePattern":"^_"}]}}
];
