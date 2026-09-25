import type { Request, Response } from "express";
import { signUp } from "../../services/auth/auth.service";
import { AppError } from "../../lib/error";
import { signUpSchema } from "../../schemas/auth/auth.schema.ts";


export async function signUpController(req: Request, res: Response){
    try {
        const { name, email, phoneNumber, password } = req.body;

        const validation = signUpSchema.safeParse(req.body);

      if (!validation.success) {

        const errors = Object.fromEntries(validation.error.issues.map(issue => [issue.path[0], issue.message]));


            return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors,
            });
        }

        const result = await signUp({ name, email, phoneNumber, password, deviceInfo: req.headers["user-agent"], ipAddress: req.ip });
        
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result.user,
        });

    } catch (error) {
        console.error("Error in signUpController:", error);

        if(error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "An error occurred during registration",
            
        });

    }
}