import type { Request, Response } from "express";
import { signUp, refreshaccessToken, getMyProfile } from "../../services/auth/auth.service";
import { AppError } from "../../lib/error";
import { signUpSchema } from "../../schemas/auth/auth.schema.ts";
import { success } from "zod";



export async function signUpController(req: Request, res: Response){
    try {
        const { name, email, phoneNumber,  } = req.body;

        const validation = signUpSchema.safeParse(req.body);

      if (!validation.success) {

        const errors = Object.fromEntries(validation.error.issues.map(issue => [issue.path[0], issue.message]));


            return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors,
            });
        }

        const result = await signUp({ name, email, phoneNumber, deviceInfo: req.headers["user-agent"], ipAddress: req.ip });
        
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
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

export async function refreshTokenController(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if(!refreshToken){
        return res.status(400).json(
            {
                success: false,
                message: "Refresh token is required"
            }
        )
    }

    const result = await refreshaccessToken(refreshToken);

    return res.status(200).json({
        success: true,
        message: "Access token refreshed successfuly",
        accessToken: result.accessToken
    })
}


export async function getProfiel(req: Request, res: Response) {
    
    try{

    const user = await getMyProfile(req.user!.id)    

    if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });

    }catch(error){
        console.log(error);

    }
}