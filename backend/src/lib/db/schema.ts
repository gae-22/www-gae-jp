import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Profile table
export const profiles = sqliteTable('profiles', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    roles: text('roles', { mode: 'json' }).$type<string[]>().notNull(),
    experienceYears: integer('experience_years').notNull(),
    projectCount: integer('project_count').notNull(),
});

// Timeline table
export const timeline = sqliteTable('timeline', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    title: text('title').notNull(),
    organization: text('organization'),
    description: text('description').notNull(),
    order: integer('order').notNull(),
});

// Gear table
export const gear = sqliteTable('gear', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    order: integer('order').notNull(),
});

// Skills table
export const skills = sqliteTable('skills', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category', {
        enum: ['languages', 'frameworks', 'others'],
    }).notNull(),
    name: text('name').notNull(),
    order: integer('order').notNull(),
});

// Users table (for authentication)
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    hashedPassword: text('hashed_password').notNull(),
});

// Sessions table (for Lucia auth)
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    expiresAt: integer('expires_at').notNull(),
});
