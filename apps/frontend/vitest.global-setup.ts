import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The generated MUI icon-path maps are gitignored and only rebuilt by dev/build.
// Tests import them via #generated/*, so ensure they exist before the suite loads —
// otherwise a clean checkout or CI (which runs test:unit:ci directly, not build)
// cannot resolve the imports and the importing suites fail to load.
const generatorScript = fileURLToPath(new URL("./scripts/generate-mui-icon-paths.mjs", import.meta.url));
const generatedMaps = ["base", "outlined", "variants"].map((kind) =>
    fileURLToPath(new URL(`./src/generated/mui-icon-paths.${kind}.js`, import.meta.url))
);

export default function ensureGeneratedIconPaths() {
    if (generatedMaps.every(existsSync)) {
        return;
    }
    execFileSync(process.execPath, [generatorScript], { stdio: "inherit" });
}
