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
    const isDebugMode = process.env.NODE_ENV !== "production";

    const debugLog = (step: string, details?: unknown) => {
        if (isDebugMode) {
            console.log(
                `[Forgot Password] ${new Date().toISOString()} - ${step}`,
                details ?? "",
            );
        }
    };

    try {
        debugLog("STEP 1: Process started");

        // STEP 2: Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        debugLog("STEP 2: Email normalized");

        // STEP 3: Check frontend URL
        const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");

        if (!frontendUrl) {
            throw new Error("FRONTEND_URL is not configured.");
        }

        let parsedFrontendUrl: URL;

        try {
            parsedFrontendUrl = new URL(frontendUrl);
        } catch {
            throw new Error("FRONTEND_URL is not a valid URL.");
        }

        if (
            !["http:", "https:"].includes(parsedFrontendUrl.protocol) ||
            (process.env.NODE_ENV === "production" &&
                parsedFrontendUrl.protocol !== "https:")
        ) {
            throw new Error("FRONTEND_URL must use a valid HTTP/HTTPS URL.");
        }

        debugLog("STEP 3: Frontend URL validated", {
            origin: parsedFrontendUrl.origin,
        });

        // STEP 4: Find admin
        debugLog("STEP 4: Searching admin in database");

        const [existingAdmin] = await db
            .select()
            .from(admin)
            .where(eq(admin.email, normalizedEmail))
            .limit(1);

        if (!existingAdmin) {
            debugLog("STEP 5: No matching admin found");

            // Do not reveal whether an account exists.
            return {
                success: true,
                message:
                    "If an account exists with this email, a password reset link will be sent.",
            };
        }

        debugLog("STEP 5: Admin found");

        // STEP 6: Generate reset token
        const { token, hashedToken, expiresAt } = generateResetToken();

        debugLog("STEP 6: Reset token generated", {
            expiresAt: expiresAt.toISOString(),
        });

        // STEP 7: Delete old tokens
        await db
            .delete(passwordResetToken)
            .where(eq(passwordResetToken.userId, existingAdmin.id));

        debugLog("STEP 7: Previous reset tokens deleted");

        // STEP 8: Save token hash
        await db.insert(passwordResetToken).values({
            id: crypto.randomUUID(),
            userId: existingAdmin.id,
            tokenHash: hashedToken,
            expiresAt,
        });

        debugLog("STEP 8: Reset token saved in database");

        // STEP 9: Create reset URL
        const resetUrl = new URL(
            "/admin/reset-password",
            parsedFrontendUrl.origin,
        );

        resetUrl.searchParams.set("token", token);

        // Never log the full reset URL or raw token.
        debugLog("STEP 9: Reset URL created", {
            origin: resetUrl.origin,
            pathname: resetUrl.pathname,
        });

        // STEP 10: Send email
        try {
            debugLog("STEP 10: Sending password reset email");

            await sendPasswordResetEmail({
                to: existingAdmin.email!,
                resetLink: resetUrl.toString(),
            });

            debugLog("STEP 11: Email sent successfully");
        } catch (emailError) {
            console.error(
                "[Forgot Password] EMAIL SENDING FAILED:",
                emailError,
            );

            // STEP 12: Delete unused reset token if email failed
            try {
                await db
                    .delete(passwordResetToken)
                    .where(eq(passwordResetToken.tokenHash, hashedToken));

                debugLog("STEP 12: Reset token cleaned up");
            } catch (cleanupError) {
                console.error(
                    "[Forgot Password] TOKEN CLEANUP FAILED:",
                    cleanupError,
                );
            }

            throw emailError;
        }

        // STEP 13: Complete
        debugLog("STEP 13: Process completed successfully");

        return {
            success: true,
            message:
                "If an account exists with this email, a password reset link will be sent.",
        };
    } catch (error) {
        console.error(
            `[Forgot Password] ${new Date().toISOString()} - PROCESS FAILED:`,
            error,
        );

        throw error;
    }
}






export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const { token, newPassword } = input;

    // 1. Validate new password
    if (!/^\d{6}$/.test(newPassword)) {
        return new AppError("Password must be exactly 6 digits.", 400);
    }

    // 2. Hash the reset token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

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
            return new AppError("Invalid or expired password reset link.", 400);
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
