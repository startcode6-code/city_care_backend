
import { Router } from "express";
import { createBlogController, deleteBlogController, updateBlogController, uploadBlogPhotoOnly, getBlogController, updateBlogPhoto } from "../../controllers/blog/blog.controller";
import { uploadDoctorPhoto as uploadMiddleware } from "../../middleware/upload";
import { authenicateUser } from "../../middleware/user-auth";

const router = Router();

router.post("/create", authenicateUser, createBlogController);
router.patch("/update/:id", updateBlogController);
router.delete("/delete/:id", deleteBlogController);
router.post("/upload-photo", uploadMiddleware.single("photo"), uploadBlogPhotoOnly);
router.post("/update-photo/:id", uploadMiddleware.single("photo"), updateBlogPhoto);
router.get("/get-blog/public", getBlogController);
router.get("/get-blog", authenicateUser, getBlogController);





export default router;
