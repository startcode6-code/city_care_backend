import { Router } from "express";
import { getDashboardStats } from "../../controllers/dashboard/dashboard.controller";
import { authenicateUser } from "../../middleware/user-auth";

const router = Router();

router.get("/stats", getDashboardStats);

export default router;