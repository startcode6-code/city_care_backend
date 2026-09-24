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
  sessionVersion: number;
}) {

  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "15m", });

}


export function generateRefreshToken(payload: {
  userId: string;
  sessionVersion: number;
}) {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "30d", });
}