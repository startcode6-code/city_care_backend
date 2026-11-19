
import { randomBytes, } from "crypto";
import { db } from "../../db";
import { appointment } from "../../db/schema/appointment";
import { AppError } from "../../lib/error";
import { eq } from "drizzle-orm";

interface CreateAppointmentInput {
    name: string;
    phone: string;
    email?: string;
    department: string;
    doctor?: string;
    package?: string;
    date: string;
    time: string;
    reason?: string;
}

interface UpdateAppointmentInput {
    name?: string;
    phone?: string;
    email?: string | null;
    department?: string;
    doctor?: string | null;
    package?: string | null;
    date?: string;
    time?: string;
    reason?: string | null;
    status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

export async function createAppointmentService(
    input: CreateAppointmentInput
) {
    try {
        const {
            name,
            phone,
            email,
            department,
            doctor,
            package: packageSlug,
            date,
            time,
            reason,
        } = input;

        // Generate unique appointment reference
        const reference = `KPH-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

        // Insert appointment into database
        const [newAppointment] = await db
            .insert(appointment)
            .values({
                reference,
                name: name.trim(),
                phone: phone.trim(),
                email: email?.trim() || null,
                department,
                doctor: doctor || null,
                package: packageSlug || null,
                date,
                time,
                reason: reason?.trim() || null,
                status: "PENDING",
            })
            .returning();

        if (!newAppointment) {
            throw new AppError("Failed to create appointment.", 500);
        }

        return newAppointment;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error("Create Appointment Service Error:", error);

        throw new AppError("Something went wrong while creating appointment.", 500);
    }
}


export async function updateAppointmentService(
    id: string,
    input: UpdateAppointmentInput
) {
    try {
        const [existingAppointment] = await db
            .select()
            .from(appointment)
            .where(eq(appointment.id, id))
            .limit(1);

        if (!existingAppointment) {
            throw new AppError("Appointment not found.", 404);
        }

        const updateData = {
            ...(input.name !== undefined && {
                name: input.name.trim(),
            }),
            ...(input.phone !== undefined && {
                phone: input.phone.trim(),
            }),
            ...(input.email !== undefined && {
                email: input.email?.trim() || null,
            }),
            ...(input.department !== undefined && {
                department: input.department,
            }),
            ...(input.doctor !== undefined && {
                doctor: input.doctor,
            }),
            ...(input.package !== undefined && {
                package: input.package,
            }),
            ...(input.date !== undefined && {
                date: input.date,
            }),
            ...(input.time !== undefined && {
                time: input.time,
            }),
            ...(input.reason !== undefined && {
                reason: input.reason,
            }),
            ...(input.status !== undefined && {
                status: input.status,
            }),
            updatedAt: new Date(),
        };

        const [updatedAppointment] = await db
            .update(appointment)
            .set(updateData)
            .where(eq(appointment.id, id))
            .returning();

        if (!updatedAppointment) {
            throw new AppError(
                "Failed to update appointment.",
                500
            );
        }

        return updatedAppointment;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error("Update Appointment Service Error:", error);

        throw new AppError(
            "Something went wrong while updating appointment.",
            500
        );
    }
}

export async function deleteAppointmentService(id: string) {
    try {
        // Check appointment exists
        const [existingAppointment] = await db
            .select()
            .from(appointment)
            .where(eq(appointment.id, id))
            .limit(1);

        if (!existingAppointment) {
            throw new AppError("Appointment not found.", 404);
        }

        // Delete appointment
        const [deletedAppointment] = await db
            .delete(appointment)
            .where(eq(appointment.id, id))
            .returning();

        if (!deletedAppointment) {
            throw new AppError(
                "Failed to delete appointment.",
                500
            );
        }

        return deletedAppointment;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error("Delete Appointment Service Error:", error);

        throw new AppError(
            "Something went wrong while deleting appointment.",
            500
        );
    }
}