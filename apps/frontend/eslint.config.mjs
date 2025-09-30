import { globalIgnores } from "eslint/config";
import { reactJsConfig } from "@repo/eslint-config/react-js";

const customJavaScriptConfig = {
    files: ["**/*.{cjs,js,jsx,mjs}"],
    rules: {
        "import/no-anonymous-default-export ": "off",
    },
};

const customAppTypeScriptConfig = {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
        parserOptions: {
            project: "./tsconfig.app.json",
        },
    },
};

const customNodeTypeScriptConfig = {
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/**"],
    languageOptions: {
        parserOptions: {
            project: "./tsconfig.node.json",
        },
    },
    rules: {
        "no-restricted-syntax": "off",
    },
};

export default [
    globalIgnores(["build", "dist", ".vite", "playwright-report"]),
    customJavaScriptConfig,
    customAppTypeScriptConfig,
    customNodeTypeScriptConfig,
    ...reactJsConfig,
];
