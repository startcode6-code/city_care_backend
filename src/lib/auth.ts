import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not defined in the environment variables.");
}

type TokenPayload = {
  userId: string;
  sessionId: string;
  sessionVersion: number;
};


function readToken(token: string, secret: string,): TokenPayload {
  const decoded = jwt.verify(token, secret);

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload.");
  }

  const payload = decoded as JwtPayload;

  if (
    typeof payload.userId !== "string" ||
    typeof payload.sessionId !== "string" ||
    typeof payload.sessionVersion !== "number"
  ) {
    throw new Error("Invalid token payload.");
  }

  return {
    userId: payload.userId,
    sessionId: payload.sessionId,
    sessionVersion: payload.sessionVersion,
  };
}



export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePasswords(password: string, passwordsHash: string) {
  return bcrypt.compare(password, passwordsHash);
}

export function generateAccessToken(payload: {
  userId: string;
  sessionId: string;
  sessionVersion: number;
}) {

  return jwt.sign(payload, ACCESS_SECRET as string, { expiresIn: "2m", });

}


export function generateRefreshToken(payload: {
  userId: string;
  sessionVersion: number;
  sessionId: string;
}) {
  return jwt.sign(payload, REFRESH_SECRET as string, { expiresIn: "30d", });
}


export function verifyRefeshToken(token: string): { userId: string; sessionVersion: number; sessionId: string } {
  try {
    return readToken(token, REFRESH_SECRET!);
  } catch (error) {
    throw new Error("Invalid refresh token.");
  }
}


export function verifyAccessToken(token: string): { userId: string; sessionVersion: number; sessionId: string } {
  try {
    return readToken(token, ACCESS_SECRET!);
  } catch {
    throw new Error("Invalid access token.");
  }
}