// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import yaml from '@modyfi/vite-plugin-yaml';

import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import sitemapNoindexFilter from './integrations/sitemap-noindex-filter.mjs';

// https://astro.build/config
export default defineConfig({
  site: "https://fantinel.dev",
  integrations: [svelte(), sitemap(), sitemapNoindexFilter()],
  devToolbar: { enabled: false },

  markdown: {
    syntaxHighlight: 'prism',
    prism: {
      languages: ['python', 'javascript', 'typescript', 'bash', 'json', 'markdown', 'html', 'css', 'sql', 'yaml'],
      additionalLanguages: ['python'],
    },
  },

  vite: {
    plugins: [yaml()]
  },

  adapter: vercel()
});
