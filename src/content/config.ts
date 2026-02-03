import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z
            .object({
                title: z.string().max(100),
                description: z.string().max(160),
                publishedAt: z.coerce.date(),
                updatedAt: z.coerce.date().optional(),
                cover: image().optional(),
                coverAlt: z.string().optional(),
                tags: z.array(z.string()).default([]),
                featured: z.boolean().default(false),
                draft: z.boolean().default(false),
            })
            .refine(
                (data) => {
                    // coverAlt is required if cover is present
                    if (data.cover && !data.coverAlt) return false;
                    return true;
                },
                {
                    message: 'coverAlt is required when cover is set',
                    path: ['coverAlt'],
                },
            ),
});

export const collections = { blog };
