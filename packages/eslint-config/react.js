import eslintReact from "eslint-plugin-react";
import eslintReactHooks from "eslint-plugin-react-hooks";
import eslintReactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import { config as baseConfig } from "./base.js";

const reactSettings = {
    settings: {
        react: {
            version: "detect",
        },
    },
    plugins: {
        react: eslintReact,
    },
    rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
    },
};

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const reactJsConfig = [
    ...baseConfig,
    eslintReactHooks.configs["recommended-latest"],
    eslintReactRefresh.configs.vite,
    eslintReact.configs.flat.recommended,
    reactSettings,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                process: "readonly",
            },
        },
    },
];
