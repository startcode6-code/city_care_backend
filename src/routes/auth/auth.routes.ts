import { Router } from "express";
import { signUpController, loginController, refreshTokenController, getProfiel } from "../../controllers/auth/auth.controller";
import { authenicateUser } from "../../middleware/user-auth";
import { forgotPasswordController, resetPasswordController } from "../../controllers/auth/forgot-password-controller";

const router = Router();

router.post("/signup", signUpController);

router.post("/refresh", refreshTokenController);

router.get("/me", authenicateUser, getProfiel)

router.post("/signin", loginController);

router.post("/forgot-password", forgotPasswordController);

router.post("/reset-password", resetPasswordController);


export default router;