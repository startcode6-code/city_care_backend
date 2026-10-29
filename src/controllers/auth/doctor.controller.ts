
import type { Request, Response } from "express";
import { createDoctorService, updateDoctorService, getDoctorsService, deleteDoctorService } from "../../services/auth/doctor.service";
import { AppError } from "../../lib/error";

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

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error while creating doctor.",
        });
    }
}


export async function updateDoctor(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login again.",
            });
        }

        const id = req.params.id;

        if (typeof id !== "string" || !id.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid doctor ID is required.",
            });
        }

        const {
            name,
            department,
            role,
            years,
            days,
            languages,
            bio,
        } = req.body;

        const hasUpdates = [
            name,
            department,
            role,
            years,
            days,
            languages,
            bio,
        ].some((value) => value !== undefined);

        if (!hasUpdates) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update.",
            });
        }

        // Validate only fields provided in the request
        if ((name !== undefined && (typeof name !== "string" || !name.trim())) ||
            (department !== undefined && (typeof department !== "string" || !department.trim())) ||
            (role !== undefined && (typeof role !== "string" || !role.trim())) ||
            (days !== undefined && (typeof days !== "string" || !days.trim())) ||
            (bio !== undefined && (typeof bio !== "string" || !bio.trim())) ||
            (years !== undefined && (typeof years !== "number" ||
                !Number.isInteger(years) ||
                years < 0)) ||
            (languages !== undefined &&
                (!Array.isArray(languages) ||
                    languages.length === 0 ||
                    !languages.every(
                        (language: unknown) =>
                            typeof language === "string" &&
                            supportedLanguages.includes(
                                language as (typeof supportedLanguages)[number]
                            )
                    )))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor fields provided.",
            });
        }

        const doctor = await updateDoctorService(id, {
            name,
            department,
            role,
            years,
            days,
            languages,
            bio,
        });

        return res.status(200).json({
            success: true,
            message: "Doctor updated successfully.",
            data: doctor,
        });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Update doctor error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while updating doctor.",
        });
    }
}


export async function getDoctors(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login again.",
            });
        }

        const doctorsList = await getDoctorsService();

        return res.status(200).json({
            success: true,
            message: "Doctors fetched successfully.",
            results: doctorsList.length,
            data: doctorsList,
        });
    } catch (error: unknown) {
        console.error("Fetch doctors error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching doctors.",
        });
    }
}

export async function deleteDoctor(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login again.",
            });
        }

        const id = req.params.id;

        if (typeof id !== "string" || !id.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid doctor ID is required.",
            });
        }

        await deleteDoctorService(id);

        return res.status(200).json({
            success: true,
            message: "Doctor deleted successfully.",
        });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Delete doctor error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting doctor.",
        });
    }
}