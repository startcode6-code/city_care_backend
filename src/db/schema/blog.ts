
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
    userId: text("user_id").notNull().references(() => admin.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    imageUrl: text("image_url"),
    imagePublicId: text("image_public_id"),
    readTime: varchar("read_time", { length: 50 }),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    status: blogStatusEnum("status").notNull().default("DRAFT"),
    isFeatured: boolean("is_featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true, }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
