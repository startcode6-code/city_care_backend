
import type { Request, Response, NextFunction } from "express";
import { uploadDoctorPhotoService, deleteDoctorPhotoService, } from "../../services/doctor/doctor.service";
import { AppError } from "../../lib/error";
import { uploadImageToCloudinary } from "../../services/cloudinary/cloudinary.service";



export async function uploadDoctorPhotoOnly(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            throw new AppError("Please select a photo.", 400);
        }

        const uploadedImage = await uploadImageToCloudinary({ buffer: req.file.buffer, folderName: "doctors" });

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


export async function updateDoctorPhoto(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string" || !id.trim()) {
            throw new AppError("Invalid doctor ID.", 400);
        }

        if (!req.file) {
            throw new AppError("Please select a photo.", 400);
        }

        const doctor = await uploadDoctorPhotoService(id, req.file);

        return res.status(200).json({
            success: true,
            message: "Doctor photo updated successfully.",
            data: doctor,
        });

    } catch (error) {
        next(error);
    }
}

export async function deleteDoctorPhoto(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string" || !id.trim()) {
            throw new AppError("Invalid doctor ID.", 400);
        }

        const doctor = await deleteDoctorPhotoService(id);

        return res.status(200).json({
            success: true,
            message: "Doctor photo deleted successfully.",
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}
