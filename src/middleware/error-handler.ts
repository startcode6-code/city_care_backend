import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/error";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    console.error("Error:", err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error.",
    });
}