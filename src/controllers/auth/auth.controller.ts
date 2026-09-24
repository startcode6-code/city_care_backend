import type { Request, Response } from "express";
import { signUp } from "../../services/auth/auth.service";

export async function signUpController(req: Request, res: Response){
    try {
        const { name, email, phoneNumber, password } = req.body;

        const result = await signUp({ name, email, phoneNumber, password});
        
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result,
        });
    } catch (error) {
        console.error("Error in signUpController:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during registration",
            error: error instanceof Error ? error.message : String(error),
        });
    }
}