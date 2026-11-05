
import type { Request, Response, NextFunction } from "express";
import { createDoctorService, updateDoctorService, getDoctorsService, deleteDoctorService, deleteDoctorPhotoService } from "../../services/doctor/doctor.service";
import { AppError } from "../../lib/error";

const supportedLanguages = [
    "ENGLISH", "HINDI", "MANDARIN", "SPANISH",
    "FRENCH", "GERMAN", "ARABIC", "BENGALI",
    "URDU", "TAMIL", "TELUGU", "MARATHI",
    "PUNJABI", "GUJARATI", "JAPANESE",
] as const;



export async function createDoctor(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError(
                "Unauthorized. Please login again.",
                401
            );
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
            photoUrl,
            photoPublicId,
        } = req.body;

        // Validate required text fields
        if (
            typeof slug !== "string" || !slug.trim() ||
            typeof name !== "string" || !name.trim() ||
            typeof department !== "string" || !department.trim() ||
            typeof role !== "string" || !role.trim() ||
            typeof days !== "string" || !days.trim() ||
            typeof bio !== "string" || !bio.trim()
        ) {
            throw new AppError(
                "Please provide all required doctor fields.",
                400
            );
        }

        // Validate experience
        if (
            typeof years !== "number" ||
            !Number.isInteger(years) ||
            years < 0
        ) {
            throw new AppError(
                "Invalid doctor experience.",
                400
            );
        }

        // Validate languages
        if (
            !Array.isArray(languages) ||
            languages.length === 0 ||
            !languages.every((language: unknown) =>
                typeof language === "string" &&
                supportedLanguages.includes(
                    language as (typeof supportedLanguages)[number]
                )
            )
        ) {
            throw new AppError(
                "Please provide valid doctor languages.",
                400
            );
        }

        // Validate Cloudinary photo URL
        let validPhotoUrl = false;

        try {
            const parsedUrl = new URL(photoUrl);

            validPhotoUrl =
                parsedUrl.protocol === "https:" &&
                parsedUrl.hostname === "res.cloudinary.com";
        } catch {
            validPhotoUrl = false;
        }

        if (
            !validPhotoUrl ||
            typeof photoPublicId !== "string" ||
            !photoPublicId.trim()
        ) {
            throw new AppError(
                "Valid doctor photo is required.",
                400
            );
        }

        const doctor = await createDoctorService({
            userId,
            slug: slug.trim(),
            name: name.trim(),
            department: department.trim(),
            role: role.trim(),
            years,
            days: days.trim(),
            languages,
            bio: bio.trim(),
            photoUrl,
            photoPublicId: photoPublicId.trim(),
        });

        return res.status(201).json({
            success: true,
            message: "Doctor created successfully.",
            data: doctor,
        });

    } catch (error) {
        next(error);
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

        await deleteDoctorPhotoService(id)

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