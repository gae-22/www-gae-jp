// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import { visit } from 'unist-util-visit';
import rehypePrettyCode from 'rehype-pretty-code';
import { transformerNotationDiff } from '@shikijs/transformers';

// Simple Remark plugin to split ```lang:filename into lang and metadata
// Remark plugin to transform code blocks to CodeBlock components
function remarkCodeBlockComponent() {
    /** @param {import('mdast').Root} tree */
    return (tree) => {
        visit(tree, 'code', (node, index, parent) => {
            let lang = node.lang || 'text';
            let title = '';

            if (lang.includes(':')) {
                const parts = lang.split(':');
                lang = parts[0];
                title = parts.slice(1).join(':');
            }

            // Create MDX Component Node
            const componentNode = {
                type: 'mdxJsxFlowElement',
                name: 'CodeBlock',
                attributes: [
                    {
                        type: 'mdxJsxAttribute',
                        name: 'code',
                        value: node.value,
                    },
                    { type: 'mdxJsxAttribute', name: 'lang', value: lang },
                    { type: 'mdxJsxAttribute', name: 'title', value: title },
                ],
                children: [],
            };

            // Replace the code node with the component node
            if (parent && index !== null && index !== undefined) {
                parent.children.splice(index, 1, componentNode);
            }
        });
    };
}

import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.gae-jp.net',
    output: 'server',
    adapter: node({
        mode: 'standalone',
    }),
    security: {
        // 開発環境ではチェックを無効化、本番環境では有効化
        checkOrigin: process.env.NODE_ENV === 'production',
        // 本番環境では許可するオリジンを指定
        ...(process.env.NODE_ENV === 'production' && {
            allowedOrigins: ['https://www.gae-jp.net'],
        }),
    },
    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [
        mdx({
            syntaxHighlight: false,
            remarkPlugins: [remarkCodeBlockComponent],
            rehypePlugins: [
                [
                    rehypePrettyCode,
                    {
                        theme: 'tokyo-night',
                        keepBackground: false, // We'll handle this in CSS
                        transformers: [transformerNotationDiff()],
                    },
                ],
            ],
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
