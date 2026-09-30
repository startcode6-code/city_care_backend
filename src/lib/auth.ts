import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";     

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

export async function hashPassword(password: string){
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

  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "2m", });

}


export function generateRefreshToken(payload: {
  userId: string;
  sessionVersion: number;
}) {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "30d", });
}


export function verifyRefeshToken(token: string): { userId: string; sessionVersion: number } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string; sessionVersion: number };
    return decoded;
  } catch (error) {
    throw new Error("Invalid refresh token.");
  }
}


export function verifyAccessToken(token: string): { userId: string; sessionVersion: number; sessionId :string } {
  try {
    const decoded = jwt.verify(token,JWT_SECRET as string ) as {
      userId: string;
      sessionVersion: number;
      sessionId : string
    };

    return decoded;
  } catch {
    throw new Error("Invalid access token.");
  }
}