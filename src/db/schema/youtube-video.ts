
import {
    pgTable,
    uuid,
    text,
    varchar,
    timestamp,
} from "drizzle-orm/pg-core";

import { admin } from "./admin";

export const youtubeVideo = pgTable("youtube-video", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => admin.id),
    slug: varchar("slug", { length: 150 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    videoUrl: text("video_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, }).defaultNow().notNull(),
});
