import eslintJs from "@eslint/js";
import eslintTs from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import turboPlugin from "eslint-plugin-turbo";
import tsParser from "@typescript-eslint/parser";
import vitest from "@vitest/eslint-plugin";

const customJavaScriptConfig = {
    files: ["**/*.{cjs,js,jsx,mjs}"],
    languageOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
    },
    rules: {
        indent: ["error", 4],
        "linebreak-style": ["warn", "unix"],
        quotes: ["warn", "double"],
        semi: ["error", "always"],
        "no-unused-vars": 0,
        "max-len": "off",
    },
};

const customTypescriptBaseConfig = {
    plugins: {
        "import/parsers": tsParser,
        turbo: turboPlugin,
    },
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2024,
        sourceType: "module",
    },
    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },
        vitest: {
            typecheck: true,
        },
    },
    rules: {
        indent: ["error", 4],
        "linebreak-style": ["warn", "unix"],
        quotes: ["warn", "double"],
        semi: ["error", "always"],
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        //"turbo/no-undeclared-env-vars": "error",
        "max-len": "off",
    },
};

const customTypescriptSrcConfig = {
    files: ["**/src/*.{ts,tsx}"],
    ...customTypescriptBaseConfig,
    rules: {
        "no-restricted-syntax": [
            "error",
            {
                selector: "ExportDefaultDeclaration",
                message: "Prefer named exports",
            },
        ],
    },
};

const customTypescriptConfig = {
    files: ["**/*.{ts,tsx}"],
    ...customTypescriptBaseConfig,
};

// Add the files for applying the recommended TypeScript configs
// only for the Typescript files.
// This is necessary when we have the multiple extensions files
// (e.g. .ts, .tsx, .js, .cjs, .mjs, etc.).
const recommendedTypeScriptConfigs = [
    ...eslintTs.configs.recommended.map((config) => ({
        ...config,
        files: ["**/*.{ts,tsx}"],
    })),
    ...eslintTs.configs.stylistic.map((config) => ({
        ...config,
        files: ["**/*.{ts,tsx}"],
    })),
];

const vitestConfig = {
    files: ["tests/**"],
    plugins: {
        vitest,
    },
    languageOptions: {
        globals: {
            ...vitest.environments.env.globals,
        },
    },
};

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
    eslintJs.configs.recommended,
    ...recommendedTypeScriptConfigs,
    customJavaScriptConfig,
    customTypescriptSrcConfig,
    customTypescriptConfig,
    vitestConfig,
    eslintConfigPrettier,
];
