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

        const sessionId = crypto.randomUUID()

        await db.update(sessions).set({
            isRevoked: true,
            revokedAt: new Date()
        }).where(eq(sessions.userId, existingUser.id))

        const sessionVersion = 1;
        const accessToken = generateAccessToken({ userId: user.id, sessionVersion, sessionId });
        const refreshToken = generateRefreshToken({ userId: user.id, sessionVersion });

        const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 ); // 30 days from now

         await db.insert(sessions).values({
            id: sessionId,
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

    const sessionId = crypto.randomUUID();

    const sessionVersion = 1;

    const accessToken = generateAccessToken({ userId: user.id, sessionVersion, sessionId });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionVersion });

    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 ); // 30 days from now

    await db.insert(sessions).values({
        id: sessionId,
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

    const sessionId = crypto.randomUUID()
    const tokenHash = createHash("sha256").update(oldRefreshToken).digest("hex");

    const [session] = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);

    if (!session) {
        throw new AppError("Session not found.", 404);
    }

    if(session.isRevoked){
        throw new AppError("Your session expired because someone logged in to your account.", 401)
    }

    if (session.expiresAt < new Date()) {
        throw new AppError("Refresh token has expired.", 401);
    }

    const accessToken = generateAccessToken({userId: payload.userId, sessionVersion: payload.sessionVersion,sessionId})

    return{
        accessToken,
    }
}



export async function checkSession(id: string) {
  console.log("🔍 checkSession called");
  console.log("Session ID:", id);

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  console.log("Session from DB:", session);

  if (!session) {
    console.log("❌ Session not found");
    throw new AppError("Session not found.", 401);
  }

  console.log("Session revoked:", session.isRevoked);
  console.log("Session expires at:", session.expiresAt);
  console.log("Current time:", new Date());

if (session.isRevoked) {
  throw new AppError(
    "Your session expired because someone logged in to your account.",
    401,
    "REVOKED"
  );
}

  if (session.expiresAt < new Date()) {
    console.log("❌ Session has expired");
    throw new AppError("Session has expired.", 401);
  }

  console.log("✅ Session is valid");

  return session;
}


export async function getMyProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phoneNumber: users.phoneNumber,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user;
}




