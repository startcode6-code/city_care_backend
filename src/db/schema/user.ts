import {
  boolean,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";



export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", {  withTimezone: true, }) .notNull() .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true,}) .notNull() .defaultNow(),
});