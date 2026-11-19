
import {
    pgTable,
    text,
    varchar,
    timestamp,
    date,
    uuid,
    index,
} from "drizzle-orm/pg-core";

export const appointment = pgTable("appointment", {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: varchar("reference", { length: 30 }).notNull().unique(),
    name: varchar("name", { length: 150, }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }),
    department: varchar("department", { length: 150 }).notNull(),
    doctor: varchar("doctor", { length: 150 }),
    package: varchar("package", { length: 150 }),
    date: date("date").notNull(),
    time: varchar("time", { length: 50 }).notNull(),
    reason: text("reason"),
    status: varchar("status", { length: 30 }).notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
},
    (table) => ({
        phoneIdx: index("appointment_phone_idx").on(table.phone),
        dateIdx: index("appointment_date_idx").on(table.date),
        statusIdx: index("appointment_status_idx").on(table.status),
    })
);

export type Appointment = typeof appointment.$inferSelect;
export type NewAppointment = typeof appointment.$inferInsert;
