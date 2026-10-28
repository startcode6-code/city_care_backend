import { Router } from "express";
import { createDoctor } from "../../controllers/auth/doctor.controller";
import { authenicateUser } from "../../middleware/user-auth";

const router = Router();

router.post("/create/doctors", authenicateUser, createDoctor);

export default router;