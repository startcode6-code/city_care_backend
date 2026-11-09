import { Router } from "express";
import { authenicateUser } from "../../middleware/user-auth";
import { createService, uploadServicePhotoOnly, updateServicePhoto, updateServiceController, deleteServiceController, getServiceController, getPublicService } from "../../controllers/service/service.controller";
import { uploadDoctorPhoto as uploadMiddleware } from "../../middleware/upload";



const router = Router();

router.post("/create", authenicateUser, createService)
router.get("/get", authenicateUser, getServiceController);
router.get("/public", getPublicService);

router.patch("/update/:id", authenicateUser, updateServiceController);
router.delete("/delete/:id", authenicateUser, deleteServiceController)
router.post("/upload/service-photo", authenicateUser, uploadMiddleware.single("photo"), uploadServicePhotoOnly)
router.patch("/:id/update-photo", authenicateUser, uploadMiddleware.single("photo"), updateServicePhoto);


export default router;
