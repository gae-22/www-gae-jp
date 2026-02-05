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

const about = defineCollection({
    type: 'data',
    schema: z.object({
        name: z.string(),
        roles: z.array(z.string()),
        stats: z.object({
            experience: z.string(),
            projects: z.string(),
        }),
        timeline: z.array(
            z.object({
                year: z.string(),
                title: z.string(),
                company: z.string(),
                description: z.string().optional(),
            }),
        ),
        gear: z.array(z.string()),
        skills: z.object({
            languages: z.array(z.string()),
            frameworks: z.array(z.string()),
            others: z.array(z.string()),
        }),
    }),
});

const projects = defineCollection({
    type: 'data',
    schema: ({ image }) =>
        z.array(
            z.object({
                title: z.string(),
                description: z.string(),
                url: z.string(),
                tech: z.array(z.string()).default([]),
                thumb: image().optional(),
            }),
        ),
});

export const collections = { blog, about, projects };
