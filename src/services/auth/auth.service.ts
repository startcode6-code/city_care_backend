import { createHash } from "crypto"
import { and, eq, or } from "drizzle-orm";
import { db } from "../../db";
import { sessions } from "../../db/schema/sessions";
import { admin } from "../../db/schema/admin";
import { AppError } from "../../lib/error";

import { verifyRefeshToken, generateAccessToken, generateRefreshToken, hashPassword, comparePasswords } from "../../lib/auth";
import { id } from "zod/locales";

type SignUpInput = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  deviceInfo?: string;
  ipAddress?: string;
};

export async function signUp(input: SignUpInput) {

  const { name, email, phoneNumber, password, role } = input;


  const hashedPassword = await hashPassword(password);

  const [existingAdmin] = await db.select({ id: admin.id, email: admin.email, phoneNumber: admin.phoneNumber }).from(admin).where(or(
    eq(admin.email, email),
    eq(admin.phoneNumber, phoneNumber)
  )).limit(1)

  if (existingAdmin?.email === email) {
    throw new AppError("This email address is alreday registered", 409);
  }

  if (existingAdmin?.phoneNumber === phoneNumber) {
    throw new AppError("This phone number is alreday registered", 409);
  }


  const [user] = await db.insert(admin).values({
    id: crypto.randomUUID(),
    name,
    email,
    phoneNumber,
    password: hashedPassword,
    role

  }).returning({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
  });

  if (!user) {
    throw new Error("Failed to create user.");
  }

  const sessionId = crypto.randomUUID();

  const sessionVersion = 1;

  const accessToken = generateAccessToken({ userId: user.id, sessionVersion, sessionId });
  const refreshToken = generateRefreshToken({ userId: user.id, sessionVersion, sessionId });

  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

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






export async function loginAdmin(
  email: string,
  password: string,
  deviceInfo?: string,
  ipAddress?: string,
) {
  // 1. Find admin
  const [data] = await db
    .select()
    .from(admin)
    .where(eq(admin.email, email.trim().toLowerCase()))
    .limit(1);

  if (!data || !data.isActive) {
    throw new AppError("Invalid email or password.", 401);
  }

  // 2. Verify password
  const isPasswordValid = await comparePasswords(
    password,
    data.password,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  // 3. Create new session and tokens
  const sessionId = crypto.randomUUID();
  const sessionVersion = 1;

  const tokenPayload = {
    userId: data.id,
    sessionId,
    sessionVersion,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const tokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  );

  // 4. Revoke old sessions and create a new one atomically
  await db.transaction(async (tx) => {
    const [lockedAdmin] = await tx
      .select({ id: admin.id })
      .from(admin)
      .where(eq(admin.id, data.id))
      .for("update");

    if (!lockedAdmin) {
      throw new AppError("Admin not found.", 404);
    }

    await tx
      .update(sessions)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.userId, data.id),
          eq(sessions.isRevoked, false),
        ),
      );

    await tx.insert(sessions).values({
      id: sessionId,
      userId: data.id,
      tokenHash,
      sessionVersion,
      expiresAt,
      deviceInfo: deviceInfo || "Unknown",
      ipAddress: ipAddress || "Unknown",
    });
  });

  // 5. Return successful login data
  return {
    admin: {
      id: data.id,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: data.role,
    },
    accessToken,
    refreshToken,
  };
}






export async function refreshaccessToken(oldRefreshToken: string) {
  let payload;

  try {
    payload = verifyRefeshToken(oldRefreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const oldTokenHash = createHash("sha256")
    .update(oldRefreshToken)
    .digest("hex");

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, oldTokenHash))
    .limit(1);

  if (!session) {
    throw new AppError("Session not found or refresh token already used.", 401);
  }

  if (
    session.id !== payload.sessionId ||
    session.userId !== payload.userId ||
    session.sessionVersion !== payload.sessionVersion
  ) {
    throw new AppError("Invalid session.", 401);
  }

  if (session.isRevoked) {
    throw new AppError(
      "Your session expired because someone logged in to your account.",
      401
    );
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw new AppError("Refresh token has expired.", 401);
  }

  // Same session ID must be used for both tokens.
  const tokenPayload = {
    userId: session.userId,
    sessionId: session.id,
    sessionVersion: session.sessionVersion,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const newTokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  // Atomically replace the old refresh-token hash.
  const updated = await db
    .update(sessions)
    .set({
      tokenHash: newTokenHash,
    })
    .where(
      and(
        eq(sessions.id, session.id),
        eq(sessions.tokenHash, oldTokenHash),
        eq(sessions.isRevoked, false)
      )
    )
    .returning({ id: sessions.id });

  if (updated.length === 0) {
    throw new AppError(
      "Refresh token is invalid or has already been used.",
      401
    );
  }

  return {
    accessToken,
    refreshToken,
  };
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
    throw new AppError("Your session expired because someone logged in to your account.", 401, "REVOKED");
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
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    })
    .from(admin)
    .where(eq(admin.id, userId))
    .limit(1);

  return user;
}




