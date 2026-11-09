import { pgTable, uuid, text, varchar } from "drizzle-orm/pg-core";
import { admin } from "./admin";

export const service = pgTable("service",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id").notNull().references(() => admin.id),
        slug: varchar("slug", { length: 150 }).notNull().unique(),
        serviceName: varchar("service_name", { length: 150 }).notNull(),
        summary: varchar("summary").notNull(),
        photoUrl: text("photo_url"),
        photoPubliceId: text("photo_public_id"),
        service: text("service").array().notNull()
    }
)