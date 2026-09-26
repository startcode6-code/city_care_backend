import { createHash } from "crypto"
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { sessions } from "../../db/schema/sessions";
import { users } from "../../db/schema/user";   
import { AppError } from "../../lib/error";

import { verifyRefeshToken, generateAccessToken, generateRefreshToken, hashPassword } from "../../lib/auth"; 

type SignUpInput = {
  name: string;  
  email: string;
  phoneNumber: string;
  deviceInfo?: string;
  ipAddress?: string;
};

export async function signUp(input: SignUpInput) {

    const { name, email, phoneNumber } = input;

    const [existingUser] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);

    if(existingUser){
        const user = existingUser;

        if(!user) {
            throw new AppError("User not found.", 404);
        }

        const sessionVersion = 1;
        const accessToken = generateAccessToken({ userId: user.id, sessionVersion });
        const refreshToken = generateRefreshToken({ userId: user.id, sessionVersion });

        const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 ); // 30 days from now

         await db.insert(sessions).values({
            id: crypto.randomUUID(),
            userId: user.id,
            tokenHash,
            sessionVersion,
            expiresAt,
            deviceInfo: input.deviceInfo || "Unknown",
            ipAddress: input.ipAddress || "Unknown",
    });
         return { user, accessToken, refreshToken };
    }


    const [user] = await db.insert(users).values({
        id: crypto.randomUUID(),
        name,
        email,
        phoneNumber,

    }).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber, 
    });

    if (!user) {
        throw new Error("Failed to create user.");
    }

    const sessionVersion = 1;

    const accessToken = generateAccessToken({ userId: user.id, sessionVersion });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionVersion });

    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 ); // 30 days from now

    await db.insert(sessions).values({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        sessionVersion,
        expiresAt,
        deviceInfo: input.deviceInfo || "Unknown", 
        ipAddress: input.ipAddress || "Unknown",
    });

    return { user, accessToken, refreshToken };   
 
}


export async function refreshaccessToken(oldRefreshToken: string) {
    let payload;

    try {
        payload = verifyRefeshToken(oldRefreshToken);
    } catch (error) {
        throw new AppError("Invalid refresh token.", 401);
    }

    const tokenHash = createHash("sha256").update(oldRefreshToken).digest("hex");

    const [session] = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);

    if (!session) {
        throw new AppError("Session not found.", 404);
    }

    if(session.isRevoked){
        throw new AppError("Session has been revoked", 401)
    }

    if (session.expiresAt < new Date()) {
        throw new AppError("Refresh token has expired.", 401);
    }

    const accessToken = generateAccessToken({userId: payload.userId, sessionVersion: payload.sessionVersion})

    return{
        accessToken,
    }
}






