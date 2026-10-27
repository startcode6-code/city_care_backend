
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/error";

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

    return res.status(500).json({
        success: false,
        message: "Internal server error.",
    });
}
