
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/error";
import multer from "multer";


export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    console.error("========== API ERROR ==========");
    console.error("Path:", req.method, req.originalUrl);

    if (err instanceof Error) {
        console.error("Message:", err.message);
        console.error("Stack:", err.stack);
    } else {
        console.error("Unknown error:", err);
    }

    console.error("================================");

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "File too large. Maximum allowed size is 10 MB.",
            });
        }
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error.",
    });
}
