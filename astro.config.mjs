import { readFileSync } from "fs";
import { defineConfig } from "astro/config";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import addSlugToHeadingIds from "./src/plugins/add-slug-to-heading-ids.mjs";

// https://astro.build/config
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://lifull.github.io",
  base: "/accessibility-guidelines",
  outDir: "dist/accessibility-guidelines",
  build: {
    format: "file",
    assets: "assets",
  },
  markdown: {
    shikiConfig: {
      theme: JSON.parse(
        readFileSync("src/assets/syntax.json", { encoding: "utf-8" })
      ),
    },
    rehypePlugins: [
      rehypeHeadingIds,
      addSlugToHeadingIds,
      rehypeAutolinkHeadings,
    ],
  },
  integrations: [mdx()],
  experimental: {
    assets: true,
  },
});
