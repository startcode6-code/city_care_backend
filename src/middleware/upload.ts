import multer from "multer";
import { AppError } from "../lib/error";

const storage = multer.memoryStorage();

export const uploadDoctorPhoto = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new AppError("Only JPG, PNG and WEBP images are allowed.", 400));
        }

        cb(null, true);
    },
});