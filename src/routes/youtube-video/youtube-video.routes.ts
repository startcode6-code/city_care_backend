import { Router } from "express";
import { authenicateUser } from "../../middleware/user-auth";
import { createYoutubeVideoController, updateyoutubeVideoController, deleteYoutubeVideoController, getAllYoutubeVideosController } from "../../controllers/youtube-video/youtube-video.controller";


const router = Router();

router.post("/create", authenicateUser, createYoutubeVideoController)
router.patch("/update/:id", authenicateUser, updateyoutubeVideoController)
router.get("/get", authenicateUser, getAllYoutubeVideosController);
router.get("/get/public", getAllYoutubeVideosController);
router.delete("/delete/:id", authenicateUser, deleteYoutubeVideoController)


export default router;
