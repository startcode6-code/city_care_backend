import { Router } from "express";
import { signUpController } from "../../controllers/auth/auth.controller";

const router = Router();

router.post("/signup", signUpController);   

export default router;