import { Router } from "express";
import { createDoctor, updateDoctor, getDoctors, deleteDoctor } from "../../controllers/auth/doctor.controller";
import { authenicateUser } from "../../middleware/user-auth";

const router = Router();

router.post("/create", authenicateUser, createDoctor);
router.patch("/update/:id", authenicateUser, updateDoctor);
router.get("/get", authenicateUser, getDoctors);
router.delete("/delete/:id", authenicateUser, deleteDoctor)



export default router;