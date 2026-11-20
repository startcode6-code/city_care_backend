
import type { Request, Response, NextFunction } from "express";

import { getDashboardStatsService } from "../../services/dashboard/dashboard.service";

export const getDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const stats = await getDashboardStatsService();

        res.status(200).json({
            success: true,
            message: "Dashboard statistics fetched successfully.",
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};
