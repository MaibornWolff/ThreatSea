/**
 * Extracts SVG path data for every @mui/icons-material icon into generated maps,
 * so the app renders icons by name without bundling the per-icon components.
 * Output (gitignored, rebuilt each dev/build):
 *   mui-icon-paths.base.js      – filled (searchable)
 *   mui-icon-paths.outlined.js  – outlined (searchable)
 *   mui-icon-paths.variants.js  – Rounded/Sharp/TwoTone (loaded only on a saved-name miss)
 * Each entry is a path string, or a [tag, attributes][] array for multi-element icons.
 */
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const iconsPackageDirectory = dirname(require.resolve("@mui/icons-material"));
const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "generated");

const OUTLINED_SUFFIX = "Outlined";
const VARIANT_SUFFIX_PATTERN = /(Rounded|Sharp|TwoTone)$/;
// Matches every _jsx("<tag>", { <attributes> }) call; icon attribute objects never nest braces.
const SVG_ELEMENT_PATTERN = /_jsx\("([a-z]+)",\s*\{([\s\S]*?)\}/g;
const ATTRIBUTE_PATTERN = /(\w+):\s*"((?:[^"\\]|\\.)*)"/g;

const baseIconMap = {};
const outlinedIconMap = {};
const variantIconMap = {};
const skippedIcons = [];

const iconFileNames = readdirSync(iconsPackageDirectory)
    .filter((fileName) => fileName.endsWith(".mjs") && fileName !== "index.mjs")
    .sort();

for (const fileName of iconFileNames) {
    const iconName = fileName.replace(/\.mjs$/, "");
    const source = readFileSync(join(iconsPackageDirectory, fileName), "utf8");

    const elements = [];
    let hasUnsupportedElement = false;
    for (const elementMatch of source.matchAll(SVG_ELEMENT_PATTERN)) {
        const [, tagName, attributeSource] = elementMatch;
        if (tagName !== "path" && tagName !== "circle" && tagName !== "ellipse") {
            // MedicationLiquidTwoTone uses defs/use; skip it rather than render it broken.
            hasUnsupportedElement = true;
            break;
        }
        const attributes = {};
        for (const attributeMatch of attributeSource.matchAll(ATTRIBUTE_PATTERN)) {
            attributes[attributeMatch[1]] = attributeMatch[2];
        }
        elements.push([tagName, attributes]);
    }

    if (hasUnsupportedElement || elements.length === 0) {
        skippedIcons.push(iconName);
        continue;
    }

    const isPlainSinglePath =
        elements.length === 1 && elements[0][0] === "path" && Object.keys(elements[0][1]).length === 1;
    const iconDefinition = isPlainSinglePath ? elements[0][1].d : elements;

    if (iconName.endsWith(OUTLINED_SUFFIX)) {
        outlinedIconMap[iconName] = iconDefinition;
    } else if (VARIANT_SUFFIX_PATTERN.test(iconName)) {
        variantIconMap[iconName] = iconDefinition;
    } else {
        baseIconMap[iconName] = iconDefinition;
    }
}

if (!existsSync(outputDirectory)) {
    mkdirSync(outputDirectory, { recursive: true });
}

const typeDeclaration = [
    "type IconDefinition = string | [tagName: string, attributes: Record<string, string>][];",
    "declare const iconMap: Record<string, IconDefinition>;",
    "export default iconMap;",
    "",
].join("\n");

const writeIfChanged = (filePath, contents) => {
    // Skip identical rewrites so vite's dev watcher does not reload needlessly.
    if (!existsSync(filePath) || readFileSync(filePath, "utf8") !== contents) {
        writeFileSync(filePath, contents);
    }
};

const writeIconMap = (baseName, iconMap) => {
    writeIfChanged(join(outputDirectory, `${baseName}.js`), `export default ${JSON.stringify(iconMap)};\n`);
    writeIfChanged(join(outputDirectory, `${baseName}.d.ts`), typeDeclaration);
};

writeIconMap("mui-icon-paths.base", baseIconMap);
writeIconMap("mui-icon-paths.outlined", outlinedIconMap);
writeIconMap("mui-icon-paths.variants", variantIconMap);

console.log(
    `mui icon paths generated: ${Object.keys(baseIconMap).length} base, ` +
        `${Object.keys(outlinedIconMap).length} outlined, ` +
        `${Object.keys(variantIconMap).length} variants` +
        (skippedIcons.length ? `, skipped: ${skippedIcons.join(", ")}` : "")
);
