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

  // CONFIGURATION AVEC SHIKI (RECOMMANDÉ)
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',  // Vous pouvez changer le thème
      // Shiki supporte Python et beaucoup d'autres langages nativement
      langs: [
        'python',
        'javascript',
        'typescript',
        'bash',
        'json',
        'markdown',
        'html',
        'css'
      ],
    },
  },

  vite: {
    plugins: [yaml()]
  },

  adapter: vercel()
});
