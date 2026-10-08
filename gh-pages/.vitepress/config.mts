import { defineConfig } from "vitepress";

export default defineConfig({
  title: "ThreatSea",
  description: "Threat modeling tool implementing the 4x6 methodology",
  // Published as a GitHub Pages project site at https://maibornwolff.github.io/ThreatSea/
  base: "/ThreatSea/",
  appearance: "force-dark",
  // The OIDC guide links to local dev services (http://localhost:...)
  ignoreDeadLinks: "localhostLinks",
  // Keep the directory-style URLs (e.g. /ThreatSea/User%20Manual/) that mkdocs produced
  rewrites: {
    "README.md": "index.md",
    "User Manual.md": "User Manual/index.md",
    "Developer Setup.md": "Developer Setup/index.md",
    "Technical Documentation/:page.md": "Technical Documentation/:page/index.md",
  },
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "User Manual", link: "/User Manual/" },
      { text: "Developer Setup", link: "/Developer Setup/" },
    ],
    sidebar: [
      { text: "Home", link: "/" },
      { text: "User Manual", link: "/User Manual/" },
      {
        text: "Technical Documentation",
        items: [
          {
            text: "Architectural Decision Record",
            link: "/Technical Documentation/Architectural Decision Record/",
          },
          {
            text: "OpenID Connect Setup",
            link: "/Technical Documentation/OpenID Connect Setup/",
          },
        ],
      },
      { text: "Developer Setup", link: "/Developer Setup/" },
    ],
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/MaibornWolff/ThreatSea" }],
    outline: "deep",
  },
});
