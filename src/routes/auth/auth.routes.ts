import { Router } from "express";
import { signUpController, refreshTokenController, getProfiel } from "../../controllers/auth/auth.controller";
import { authenicateUser } from "../../middleware/user-auth";

const router = Router();

router.post("/signup", signUpController);   

router.post("/refresh", refreshTokenController);

router.get("/me", authenicateUser, getProfiel)


export default router;