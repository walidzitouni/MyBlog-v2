// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import yaml from '@modyfi/vite-plugin-yaml';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import sitemapNoindexFilter from './integrations/sitemap-noindex-filter.mjs';

// Prism language imports
// NOTE: markup-templating MUST come before php, erb, twig, etc.
import 'prismjs/components/prism-markup-templating';

import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-nginx';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-http';
import 'prismjs/components/prism-regex';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-makefile';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-nasm';

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
