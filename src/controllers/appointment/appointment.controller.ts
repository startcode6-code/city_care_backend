
import type { Request, Response, NextFunction } from "express";
import { createAppointmentService, updateAppointmentService, deleteAppointmentService } from "../../services/appointment/appointment";
import { AppError } from "../../lib/error";

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
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
        } = req.body;

        // Required field validation
        if (
            !name ||
            !phone ||
            !department ||
            !date ||
            !time
        ) {
            throw new AppError("Name, phone, department, date and time are required.", 400);
        }

        // Basic input validation
        if (typeof name !== "string" || typeof phone !== "string" || typeof department !== "string" ||
            typeof date !== "string" || typeof time !== "string") {
            throw new AppError("Invalid appointment data.", 400);
        }

        const appointment = await createAppointmentService({
            name,
            phone,
            email,
            department,
            doctor,
            package: packageSlug,
            date,
            time,
            reason,
        });

        return res.status(201).json({
            success: true,
            message: "Appointment request submitted successfully.",
            reference: appointment.reference,
            data: appointment,
        });

    } catch (error) {
        next(error);
    }
};


export const updateAppointment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;
        if (!id) {
            throw new AppError("Appointment ID is required.", 400);
        }

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
            status,
        } = req.body;

        const allowedStatuses = [
            "PENDING",
            "CONFIRMED",
            "CANCELLED",
            "COMPLETED",
        ];

        if (
            status !== undefined &&
            !allowedStatuses.includes(status)
        ) {
            throw new AppError("Invalid appointment status.", 400);
        }

        if (
            name !== undefined &&
            (typeof name !== "string" || !name.trim())
        ) {
            throw new AppError("Invalid patient name.", 400);
        }

        if (
            phone !== undefined &&
            (typeof phone !== "string" || !phone.trim())
        ) {
            throw new AppError("Invalid phone number.", 400);
        }

        if (department !== undefined &&
            (typeof department !== "string" || !department.trim())
        ) {
            throw new AppError("Invalid department.", 400);
        }

        const updatedAppointment = await updateAppointmentService(
            id,
            {
                name,
                phone,
                email,
                department,
                doctor,
                package: packageSlug,
                date,
                time,
                reason,
                status,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Appointment updated successfully.",
            data: updatedAppointment,
        });

    } catch (error) {
        next(error);
    }
};


export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        if (!id) {
            throw new AppError(
                "Appointment ID is required.",
                400
            );
        }

        const deletedAppointment =
            await deleteAppointmentService(id);

        return res.status(200).json({
            success: true,
            message: "Appointment deleted successfully.",
            data: deletedAppointment,
        });

    } catch (error) {
        next(error);
    }
};