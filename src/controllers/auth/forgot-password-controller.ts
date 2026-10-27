import type {
  Request,
  Response,
  NextFunction,
} from "express";
import { resetPassword } from "../../services/auth/forgot-password-service";
import { z } from "zod";
import { AppError } from "../../lib/error";
import { forgotPassword } from "../../services/auth/forgot-password-service";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Validate request body
    const result = forgotPasswordSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError("Please provide a valid email address.", 400);
    }

    // 2. Get validated email
    const { email } = result.data;

    // 3. Call service
    await forgotPassword(email);

    // 4. Send generic response
    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link will be sent.",
    });
  } catch (error) {
    next(error);
  }
}


export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;

    const result = await resetPassword({
      token,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
