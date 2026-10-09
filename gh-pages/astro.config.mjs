// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";
import copyAssets from "./src/copy-assets.mjs";

export default defineConfig({
    // Published as a GitHub Pages project site at https://maibornwolff.github.io/ThreatSea/
    site: "https://maibornwolff.github.io",
    base: "/ThreatSea",
    trailingSlash: "always",
    // Copy images as-is instead of optimizing them, avoids the native `sharp` dependency
    image: { service: passthroughImageService() },
    integrations: [
        copyAssets(),
        starlight({
            title: "ThreatSea",
            social: [{ icon: "github", label: "GitHub", href: "https://github.com/MaibornWolff/ThreatSea" }],
            sidebar: [
                { label: "Home", link: "/" },
                { label: "User Manual", link: "/User Manual/" },
                {
                    label: "Technical Documentation",
                    items: [
                        {
                            label: "Architectural Decision Record",
                            link: "/Technical Documentation/Architectural Decision Record/",
                        },
                        { label: "OpenID Connect Setup", link: "/Technical Documentation/OpenID Connect Setup/" },
                    ],
                },
                { label: "Developer Setup", link: "/Developer Setup/" },
            ],
        }),
    ],
});
