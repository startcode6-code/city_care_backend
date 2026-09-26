import { Router } from "express";
import { signUpController, refreshTokenController } from "../../controllers/auth/auth.controller";

const router = Router();

router.post("/signup", signUpController);   

router.post("/refresh", refreshTokenController);


export default router;