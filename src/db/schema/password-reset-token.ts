import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { admin } from "./admin";

export const passwordResetToken = pgTable("password_reset_token", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => admin.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true, }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true, }),
    createdAt: timestamp("created_at", { withTimezone: true, }).notNull().defaultNow(),
});