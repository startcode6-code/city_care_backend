
import type { Request, Response } from "express";
import { createDoctorService } from "../../services/auth/doctor.service";

const supportedLanguages = [
    "ENGLISH", "HINDI", "MANDARIN", "SPANISH",
    "FRENCH", "GERMAN", "ARABIC", "BENGALI",
    "URDU", "TAMIL", "TELUGU", "MARATHI",
    "PUNJABI", "GUJARATI", "JAPANESE",
] as const;

export async function createDoctor(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login again.",
            });
        }

        const {
            slug,
            name,
            department,
            role,
            years,
            days,
            languages,
            bio,
        } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof department !== "string" || !department.trim() ||
            typeof role !== "string" || !role.trim() ||
            typeof days !== "string" || !days.trim() ||
            typeof bio !== "string" || !bio.trim() ||
            typeof years !== "number" ||
            !Number.isInteger(years) ||
            years < 0 ||
            !Array.isArray(languages) ||
            languages.length === 0 ||
            !languages.every((language: unknown) =>
                typeof language === "string" &&
                supportedLanguages.includes(language as (typeof supportedLanguages)[number])
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required doctor fields correctly.",
            });
        }

        const doctor = await createDoctorService({
            userId,
            slug,
            name,
            department,
            role,
            years,
            days,
            languages,
            bio,
        });

        return res.status(201).json({
            success: true,
            message: "Doctor created successfully.",
            data: doctor,
        });
    } catch (error: unknown) {
        const statusCode =
            typeof error === "object" &&
                error !== null &&
                "statusCode" in error &&
                error.statusCode === 409
                ? 409
                : 500;

        if (statusCode === 500) {
            console.error("Create doctor error:", error);
        }

        return res.status(statusCode).json({
            success: false,
            message:
                statusCode === 409
                    ? "A doctor with this slug already exists."
                    : "Internal server error while creating doctor.",
        });
    }
}
