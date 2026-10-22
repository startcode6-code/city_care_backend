import type { NextFunction, Request, Response } from "express";
// import { eq } from "drizzle-orm"
// import { success } from "zod";
import { verifyAccessToken, } from "../lib/auth";
import { checkSession } from "../services/auth/auth.service";
import { AppError } from "../lib/error";



export async function authenicateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is required",
      });
    }

    const [scheme, token] = authHeader.trim().split(/\s+/);

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const payload = verifyAccessToken(token);
    const session = await checkSession(payload.sessionId);

    // Verify that this session belongs to the token's user.
    if (
      session.userId !== payload.userId ||
      session.sessionVersion !== payload.sessionVersion
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please log in again.",
      });
    }

    if (session.isRevoked) {
      return res.status(401).json({
        success: false,
        message: "Session has been revoked. Please log in again.",
      });
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",

      });
    }

    req.user = {
      id: payload.userId,
      sessionVersion: payload.sessionVersion,
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        status: error.status,
        message: error.message,
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(401).json({
      success: false,
      status: "UNAUTHORIZED",
      message: "Invalid or expired access token",
    });
  }
}
