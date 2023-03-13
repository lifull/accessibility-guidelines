import { defineConfig } from "astro/config";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import addSlugToHeadingIds from "./src/plugins/add-slug-to-heading-ids.mjs";

// https://astro.build/config
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
	integrations: [mdx()],
	experimental: {
		assets: true,
	},
	markdown: {
		rehypePlugins: [rehypeHeadingIds, addSlugToHeadingIds],
	},
});
