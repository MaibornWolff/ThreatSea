// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";

export default defineConfig({
    // Published as a GitHub Pages project site at https://maibornwolff.github.io/ThreatSea/
    site: "https://maibornwolff.github.io",
    base: "/ThreatSea",
    trailingSlash: "always",
    // Copy images as-is instead of optimizing them, avoids the native `sharp` dependency
    image: { service: passthroughImageService() },
    // Keep the old mkdocs URLs working
    redirects: {
        "/User Manual/": "/ThreatSea/user-manual/",
        "/Developer Setup/": "/ThreatSea/developer-setup/",
        "/Technical Documentation/Architectural Decision Record/":
            "/ThreatSea/technical-documentation/architectural-decision-record/",
        "/Technical Documentation/OpenID Connect Setup/": "/ThreatSea/technical-documentation/openid-connect-setup/",
    },
    integrations: [
        starlight({
            title: "ThreatSea",
            social: [{ icon: "github", label: "GitHub", href: "https://github.com/MaibornWolff/ThreatSea" }],
            // Fail the build on broken internal links; the OIDC guide intentionally links to local dev services
            plugins: [starlightLinksValidator({ errorOnLocalLinks: false })],
            sidebar: [
                { label: "Home", link: "/" },
                { label: "User Manual", slug: "user-manual" },
                {
                    label: "Technical Documentation",
                    items: [
                        "technical-documentation/architectural-decision-record",
                        "technical-documentation/openid-connect-setup",
                    ],
                },
                { label: "Developer Setup", slug: "developer-setup" },
            ],
        }),
    ],
});
