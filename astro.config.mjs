// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.gae-jp.net',
    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [mdx(), sitemap(), robotsTxt()],
});
