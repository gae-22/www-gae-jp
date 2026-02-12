export const db = {
    select: () => ({
        from: () => ({ limit: () => [], orderBy: () => [], where: () => [] }),
    }),
    insert: () => ({ values: () => ({}) }),
    update: () => ({ set: () => ({ where: () => ({}) }) }),
    delete: () => ({ where: () => ({}) }),
} as any;
