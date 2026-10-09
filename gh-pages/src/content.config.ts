import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

export const collections = {
    docs: defineCollection({
        // Keep the markdown in gh-pages/ and the mkdocs URLs (e.g. /User Manual/); README.md is the start page
        loader: glob({
            base: ".",
            pattern: ["*.md", "Technical Documentation/*.md"],
            generateId: ({ entry }) => (entry === "README.md" ? "index" : entry.replace(/\.md$/, "")),
        }),
        schema: docsSchema(),
    }),
};
