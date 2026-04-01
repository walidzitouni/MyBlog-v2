// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import yaml from '@modyfi/vite-plugin-yaml';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import sitemapNoindexFilter from './integrations/sitemap-noindex-filter.mjs';

import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

export default defineConfig({
  site: "https://fantinel.dev",
  integrations: [svelte(), sitemap(), sitemapNoindexFilter()],
  devToolbar: { enabled: false },
  markdown: {
    syntaxHighlight: 'prism',
  },
  vite: {
    plugins: [yaml()]
  },
  adapter: vercel()
});
