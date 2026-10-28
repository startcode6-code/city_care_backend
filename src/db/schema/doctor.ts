import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    uniqueIndex,
    pgEnum
} from "drizzle-orm/pg-core";
import { admin } from "./admin";

export const languageEnum = pgEnum("doctor_language", [
    "ENGLISH",
    "HINDI",
    "MANDARIN",
    "SPANISH",
    "FRENCH",
    "GERMAN",
    "ARABIC",
    "BENGALI",
    "URDU",
    "TAMIL",
    "TELUGU",
    "MARATHI",
    "PUNJABI",
    "GUJARATI",
    "JAPANESE",
]);

export const doctors = pgTable("doctors",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id").notNull().references(() => admin.id),
        slug: varchar("slug", { length: 150 }).notNull(),
        name: varchar("name", { length: 150 }).notNull(),
        department: varchar("department", { length: 100 }).notNull(),
        role: varchar("role", { length: 150 }).notNull(),
        years: integer("years").notNull(),
        days: text("days").notNull(),
        languages: languageEnum("languages")
            .array()
            .notNull(),
        bio: text("bio").notNull(),
    },
    (table) => [uniqueIndex("doctors_slug_unique").on(table.slug)]
);