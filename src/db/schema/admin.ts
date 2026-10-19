import {
  boolean,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";



export const users = pgTable("admins", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, }).notNull().defaultNow(),
});