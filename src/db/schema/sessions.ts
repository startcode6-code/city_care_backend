import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./user";


export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  deviceInfo: text("device_info"),
  deviceId: text("device_id"),
  ipAddress: text("ip_address"),
  sessionVersion: integer("session_version").notNull().default(1),
  isRevoked: boolean("is_revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at", {withTimezone: true,}),
  expiresAt: timestamp("expires_at", { withTimezone: true,}).notNull(),
  createdAt: timestamp("created_at", {withTimezone: true,}).notNull().defaultNow(),
});