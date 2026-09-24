import { createHash } from "crypto"
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { sessions } from "../../db/schema/sessions";
import { users } from "../../db/schema/user";   

import { comparePasswords, generateAccessToken, generateRefreshToken, hashPassword } from "../../lib/auth"; 

type SignUpInput = {
  name: string;  
  email: string;
  password: string;
};

export async function signUp(input: SignUpInput) {

    const { name, email, password } = input;

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if(existingUser.length > 0){
        throw new Error("User with this email already exists.");
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db.insert(users).values({
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash,
    }).returning({
        id: users.id,
        name: users.name,
        email: users.email,
    });

    if (!user) {
        throw new Error("Failed to create user.");
    }

    const sessionVersion = 1;

    const accessToken = generateAccessToken({ userId: user.id, sessionVersion });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionVersion });

    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

      const expiresAt = new Date(
         Date.now() + 30 * 24 * 60 * 60 * 1000
        ); // 30 days from now

    await db.insert(sessions).values({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        sessionVersion,
        expiresAt,
    });

    return { user, accessToken, refreshToken };   
 
}