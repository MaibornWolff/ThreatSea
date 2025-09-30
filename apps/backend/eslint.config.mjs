import { globalIgnores } from "eslint/config";
import { nodeJsConfig } from "@repo/eslint-config/node-js";

const filesToIgnore = [
    "vitest.config.ts",
    "vitest.setup.ts",
    "vitest.setup.global.ts",
    "vitest.teardown.global.ts",
    "drizzle.config.ts",
];

/** @type {import("eslint").Linter.Config} */
export default [globalIgnores([...filesToIgnore, "build/*", "dist/*"]), ...nodeJsConfig];
