// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import { visit } from 'unist-util-visit';

// Simple Remark plugin to split ```lang:filename into lang and metadata
function remarkCodeShorthand() {
    return (tree) => {
        visit(tree, 'code', (node) => {
            if (node.lang && node.lang.includes(':')) {
                const [lang, file] = node.lang.split(':');
                node.lang = lang;
                node.meta = node.meta ? `${file} ${node.meta}` : `${file}`;
            }
        });
    };
}

import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.gae-jp.net',
    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [
        mdx({
            remarkPlugins: [remarkCodeShorthand],
        }),
        sitemap(),
        robotsTxt(),
    ],
    image: {
        service: {
            entrypoint: 'astro/assets/services/noop',
        },
    },
});
