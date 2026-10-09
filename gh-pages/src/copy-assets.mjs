import { cp } from "node:fs/promises";

// Inline <img src="../assets/..."> in raw HTML is not processed by Astro, so publish assets/ as-is at <base>/assets/
export default function copyAssets() {
    return {
        name: "copy-assets",
        hooks: {
            "astro:build:done": async ({ dir }) => {
                await cp(new URL("../assets/", import.meta.url), new URL("assets/", dir), { recursive: true });
            },
        },
    };
}
