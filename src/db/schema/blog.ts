
import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    boolean,
    pgEnum,
} from "drizzle-orm/pg-core";

import { admin } from "./admin";

export const blogStatusEnum = pgEnum("blog_status", [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
]);

export const blog = pgTable("blog", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
        .notNull()
        .references(() => admin.id, { onDelete: "cascade" }),

    slug: varchar("slug", { length: 255 }).notNull().unique(),

    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),

    // Author information
    author: varchar("author", { length: 150 }).notNull(),

    // Blog image
    imageUrl: text("image_url"),
    imagePublicId: text("image_public_id"),
    imageAlt: text("image_alt"),

    // Blog content
    readTime: varchar("read_time", { length: 50 }),
    summary: text("summary").notNull(),
    content: text("content").notNull(),

    // Blog tags
    tags: text("tags").array().notNull().default([]),

    // SEO metadata
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords").array().notNull().default([]),

    // Publishing
    status: blogStatusEnum("status").notNull().default("DRAFT"),
    isFeatured: boolean("is_featured").notNull().default(false),

    publishedAt: timestamp("published_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});
