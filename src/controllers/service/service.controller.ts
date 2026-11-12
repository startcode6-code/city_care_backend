import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/error";
import { CreateServiceInput } from "../../services/service/service.service";
import { uploadImageToCloudinary } from "../../services/cloudinary/cloudinary.service";
import { uploadServicePhoto, updateService, deleteService, getService } from "../../services/service/service.service";
import { deleteServicePhoto } from "../../services/service/service.service";


export async function createService(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;

        // Authentication validation
        if (!userId) {
            throw new AppError("Unauthorized. Please login again.", 401);
        }

        const { serviceName, summary, photoUrl, photoPublicId, services } = req.body;

        // Required fields validation
        if (typeof serviceName !== "string" || !serviceName.trim() ||
            typeof summary !== "string" || !summary.trim() ||
            !Array.isArray(services) || services.length === 0) {
            throw new AppError("Please provide all required service fields.", 400);
        }

        // Services array validation
        if (!services.every((item: unknown) => typeof item === "string" && item.trim().length > 0)) {
            throw new AppError("Services must contain valid non-empty strings.", 400);
        }

        // Photo URL validation
        if (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== "string") {
            throw new AppError("Invalid photo URL.", 400);
        }

        // Photo public ID validation
        if (photoPublicId !== undefined && photoPublicId !== null && typeof photoPublicId !== "string") {
            throw new AppError("Invalid photo public ID.", 400);
        }

        const newService = await CreateServiceInput({
            userId,
            serviceName: serviceName.trim(),
            summary: summary.trim(),
            photoUrl: photoUrl ?? null,
            photoPublicId: photoPublicId ?? null,
            service: services.map((item: string) => item.trim()),
        });

        return res.status(201).json({
            success: true,
            message: "Service created successfully.",
            data: newService,
        });

    } catch (error) {
        next(error);
    }
}





export async function updateServiceController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id;

        // Authentication validation
        if (!userId) {
            throw new AppError(
                "Unauthorized. Please login again.",
                401
            );
        }

        const serviceId = req.params.id;

        if (!serviceId || typeof serviceId !== "string") {
            throw new AppError("Invalid service ID.", 400);
        }

        const {
            serviceName,
            summary,
            photoUrl,
            photoPublicId,
            service,
        } = req.body;

        // At least one field must be provided
        if (
            serviceName === undefined &&
            summary === undefined &&
            photoUrl === undefined &&
            photoPublicId === undefined &&
            service === undefined
        ) {
            throw new AppError("Please provide at least one field to update.", 400);
        }

        // Service name validation
        if (
            serviceName !== undefined &&
            (typeof serviceName !== "string" || !serviceName.trim())
        ) {
            throw new AppError("Invalid service name.", 400);
        }

        // Summary validation
        if (
            summary !== undefined &&
            (typeof summary !== "string" || !summary.trim())
        ) {
            throw new AppError("Invalid service summary.", 400);
        }

        // Photo URL validation
        if (
            photoUrl !== undefined &&
            photoUrl !== null &&
            typeof photoUrl !== "string"
        ) {
            throw new AppError("Invalid photo URL.", 400);
        }

        // Photo public ID validation
        if (
            photoPublicId !== undefined &&
            photoPublicId !== null &&
            typeof photoPublicId !== "string"
        ) {
            throw new AppError("Invalid photo public ID.", 400);
        }

        // Services array validation
        if (service !== undefined) {
            if (
                !Array.isArray(service) ||
                !service.every(
                    (item: unknown) =>
                        typeof item === "string" && item.trim().length > 0
                )
            ) {
                throw new AppError(
                    "Services must contain valid non-empty strings.",
                    400
                );
            }
        }

        const updatedService = await updateService(serviceId, {
            serviceName: serviceName?.trim(),
            summary: summary?.trim(),
            photoUrl,
            photoPublicId,
            service: service?.map((item: string) => item.trim()),
        });

        return res.status(200).json({
            success: true,
            message: "Service updated successfully.",
            data: updatedService,
        });

    } catch (error) {
        next(error);
    }
}


export async function deleteServiceController(req: Request, res: Response) {
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
                message: "A valid service ID is required.",
            });
        }

        await deleteServicePhoto(id)

        await deleteService(id);

        return res.status(200).json({
            success: true,
            message: "Service deleted successfully.",
        });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Service error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting service.",
        });
    }
}


export async function getServiceController(req: Request, res: Response) {
    try {
        const userId = req.user?.id;



        const doctorsList = await getService();

        return res.status(200).json({
            success: true,
            message: "Service fetched successfully.",
            results: doctorsList.length,
            data: doctorsList,
        });
    } catch (error: unknown) {
        console.error("Fetch service error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching doctors.",
        });
    }
}

export async function getPublicService(req: Request, res: Response, next: NextFunction) {
    try {
        const doctors = await getService();

        return res.status(200).json({
            success: true,
            message: "Service fetched successfully.",
            results: doctors.length,
            data: doctors,
        });
    } catch (error) {
        next(error);
    }
}

export async function uploadServicePhotoOnly(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            throw new AppError("Please select a photo.", 400);
        }

        const uploadedImage = await uploadImageToCloudinary({ buffer: req.file.buffer, folderName: "service" });

        return res.status(200).json({
            success: true,
            message: "Photo uploaded successfully.",
            data: {
                photoUrl: uploadedImage.secure_url,
                photoPublicId: uploadedImage.public_id,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateServicePhoto(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string" || !id.trim()) {
            throw new AppError("Invalid doctor ID.", 400);
        }

        if (!req.file) {
            throw new AppError("Please select a photo.", 400);
        }

        const doctor = await uploadServicePhoto(id, req.file);

        return res.status(200).json({
            success: true,
            message: "Service photo updated successfully.",
            data: doctor,
        });

    } catch (error) {
        next(error);
    }
}