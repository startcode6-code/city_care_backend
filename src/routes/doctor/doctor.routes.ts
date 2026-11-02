import { Router } from "express";
import { createDoctor, updateDoctor, getDoctors, deleteDoctor } from "../../controllers/auth/doctor.controller";
import { authenicateUser } from "../../middleware/user-auth";
import { uploadDoctorPhoto as uploadMiddleware } from "../../middleware/upload";
import { uploadDoctorPhotoOnly, deleteDoctorPhoto } from "../../controllers/doctor/doctor-photo.controller";

const router = Router();

router.post("/create", authenicateUser, createDoctor);
router.patch("/update/:id", authenicateUser, updateDoctor);
router.get("/get", authenicateUser, getDoctors);
router.delete("/delete/:id", authenicateUser, deleteDoctor)

router.post("/upload/doctor-photo", authenicateUser, uploadMiddleware.single("photo"), uploadDoctorPhotoOnly)

router.delete(
    "/:id/photo",
    authenicateUser,
    deleteDoctorPhoto
);



export default router;