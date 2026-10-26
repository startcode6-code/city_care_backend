import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../db";
import { admin } from "../../db/schema/admin";
import { passwordResetToken } from "../../db/schema/password-reset-token";
import { generateResetToken } from "../../utils/password-reset";
import { sendPasswordResetEmail } from "../../lib/email";
import { sessions } from "../../db/schema/sessions";
import { AppError } from "../../lib/error";
import { hashPassword } from "../../lib/auth";

type ResetPasswordInput = {
    token: string;
    newPassword: string;
};


export async function forgotPassword(email: string) {
    // 1. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Validate frontend URL before creating a token
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        throw new Error("FRONTEND_URL is not configured.");
    }

    // 3. Find admin by email
    const [existingAdmin] = await db
        .select()
        .from(admin)
        .where(eq(admin.email, normalizedEmail))
        .limit(1);

    // 4. If admin does not exist, stop here
    if (!existingAdmin) {
        return;
    }

    // 5. Generate reset token
    const { token, hashedToken, expiresAt } = generateResetToken();

    // 6. Remove previous reset tokens
    await db
        .delete(passwordResetToken)
        .where(eq(passwordResetToken.userId, existingAdmin.id));

    // 7. Save new reset token hash
    await db.insert(passwordResetToken).values({
        id: crypto.randomUUID(),
        userId: existingAdmin.id,
        tokenHash: hashedToken,
        expiresAt,
    });

    // 8. Prepare reset link
    const resetLink = `${frontendUrl}/admin/reset-password?token=${token}`;

    // 9. Send email
    try {
        await sendPasswordResetEmail({ to: existingAdmin.email!, resetLink });
    } catch (error) {
        // Invalidate token if email delivery fails
        await db
            .delete(passwordResetToken)
            .where(eq(passwordResetToken.tokenHash, hashedToken));

        throw error;
    }

    return {
        success: true,
        message: "Password reset email sent successfully.",
    };
}





export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const { token, newPassword } = input;

    // 1. Validate new password
    if (!/^\d{6}$/.test(newPassword)) {
        throw new AppError("Password must be exactly 6 digits.", 400);
    }

    // 2. Hash the reset token
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const now = new Date();

    // 3. Validate token and update password atomically
    await db.transaction(async (tx) => {
        const [resetRecord] = await tx
            .select()
            .from(passwordResetToken)
            .where(
                and(
                    eq(passwordResetToken.tokenHash, hashedToken),
                    isNull(passwordResetToken.usedAt),
                    gt(passwordResetToken.expiresAt, now),
                ),
            )
            .limit(1)
            .for("update");

        if (!resetRecord) {
            throw new AppError(
                "Invalid or expired password reset link.",
                400,
            );
        }

        // 4. Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // 5. Update admin password
        await tx
            .update(admin)
            .set({
                password: hashedPassword,
                updatedAt: now,
            })
            .where(eq(admin.id, resetRecord.userId));

        // 6. Mark reset token as used
        await tx
            .update(passwordResetToken)
            .set({
                usedAt: now,
            })
            .where(eq(passwordResetToken.id, resetRecord.id));

        // 7. Revoke existing sessions
        await tx
            .update(sessions)
            .set({
                isRevoked: true,
                revokedAt: now,
            })
            .where(
                and(
                    eq(sessions.userId, resetRecord.userId),
                    eq(sessions.isRevoked, false),
                ),
            );
    });

    // 8. Return success response
    return {
        message: "Password reset successfully. Please login again.",
    };
}
