import path from "node:path";
import { defineConfig } from "vitepress";

const srcDir = path.resolve(import.meta.dirname, "..");

// Keep the directory-style URLs (e.g. /ThreatSea/User%20Manual/) that mkdocs produced
function toPagePath(page: string): string {
  return page === "README.md" ? "index.md" : page.replace(/\.md$/, "/index.md");
}

function toPageUrl(page: string): string {
  return "/" + encodeURI(toPagePath(page).replace(/index\.md$/, ""));
}

export default defineConfig({
  title: "ThreatSea",
  description: "Threat modeling tool implementing the 4x6 methodology",
  // Published as a GitHub Pages project site at https://maibornwolff.github.io/ThreatSea/
  base: "/ThreatSea/",
  appearance: "force-dark",
  // The OIDC guide links to local dev services (http://localhost:...)
  ignoreDeadLinks: "localhostLinks",
  rewrites: toPagePath,
  markdown: {
    // VitePress resolves relative links against the rewritten page path. Resolve relative
    // links to other .md files against the source file instead, so they stay valid when
    // the markdown is read on GitHub or in an IDE.
    config(md) {
      md.core.ruler.push("source-relative-md-links", (state) => {
        const sourceFile: string | undefined = state.env.realPath ?? state.env.path;
        if (!sourceFile) return;
        for (const token of state.tokens.flatMap((t) => t.children ?? [])) {
          const href = token.type === "link_open" ? token.attrGet("href") : null;
          const match = href?.match(/^(\.{1,2}\/[^#?]*\.md)(#.*)?$/);
          if (!match) continue;
          const target = path.resolve(path.dirname(sourceFile), decodeURI(match[1]));
          const page = path.relative(srcDir, target).split(path.sep).join("/");
          token.attrSet("href", toPageUrl(page) + (match[2] ?? ""));
        }
      });
    },
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
