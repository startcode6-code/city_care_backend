import type { NextFunction, Request, Response } from "express";
// import { eq } from "drizzle-orm"
// import { success } from "zod";
import { verifyAccessToken, } from "../lib/auth";
import { checkSession } from "../services/auth/auth.service";
import { AppError } from "../lib/error";



export async function authenicateUser(req: Request, res: Response, next: NextFunction) {
    
    try{

        const authHeader = req.headers.authorization

        if(!authHeader){
            return res.status(401).json({
                success: false,
                message: "Authorization header is required"
            })
        }

        const [scheme, token] = authHeader.split(" ");

        if(scheme !== "Bearer" || !token){
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            })
        }

        const paylod = verifyAccessToken(token);

        console.log("JWT PAYLOAD:", paylod);


        const session = await checkSession(paylod.sessionId)

        if (session.isRevoked) {
        return res.status(401).json({
            success: false,
            message: "Session has been revoked",
        });
        }

        req.user = {
            id: paylod.userId,
            sessionVersion: paylod.sessionVersion
        }

        console.log(paylod);

        next();
    }catch(error){
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message,
    });
  }

  return res.status(401).json({
    success: false,
    status: "UNAUTHORIZED",
    message: "Invalid or expired access token",
  });
  }
}
