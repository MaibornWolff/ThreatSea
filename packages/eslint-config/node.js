import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use Node.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nodeJsConfig = [
    ...baseConfig,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
];
