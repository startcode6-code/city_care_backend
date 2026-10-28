
import { resend } from "../config/resent";

type PasswordResetEmailParams = {
  to: string;
  resetLink: string;
};


export async function sendPasswordResetEmail({ to, resetLink }: PasswordResetEmailParams) {

  const log = (step: string, details?: unknown) => {
    console.log(`[Password Reset Email] ${new Date().toISOString()} - ${step}`, details ?? "");
  };

  try {
    log("STEP 1: Email function started");

    const from = process.env.RESEND_FROM;

    if (!from) {
      throw new Error("RESEND_FROM is not configured.");
    }


    const allowedOrigin = "https://city-care-kohl.vercel.app";
    const parsedUrl = new URL(resetLink);

    if (parsedUrl.origin !== allowedOrigin || parsedUrl.pathname !== "/admin/reset-password" || !parsedUrl.searchParams.has("token")) {
      throw new Error("Invalid password reset link.");
    }

    log("STEP 2: Configuration validated", {
      fromConfigured: Boolean(from),
      apiKeyConfigured: Boolean(process.env.RESEND_API_KEY),
      recipientConfigured: Boolean(to),
      resetLinkValid: true,
    });

    log("STEP 3: Sending email through Resend API");

    const { data, error } = await resend.emails.send({
      from, to: [to],
      subject: "Reset Your Hospital Admin Password",
      text: `
Hello,

We received a request to reset your admin account password.

Use this link to reset your password:

${resetLink}

This link expires in 15 minutes.

If you did not request a password reset, you can ignore this email.

K.P. Sinha Memorial Hospital
      `.trim(),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your admin account password.</p>
          <a href="${resetLink}"
             style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">
            Reset Password
          </a>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
          <p>K.P. Sinha Memorial Hospital</p>
        </div>
      `,
    });

    if (error) {
      console.error("[Password Reset Email] RESEND API ERROR:", error);

      throw new Error(`Resend email failed: ${error.message}`);
    }

    log("STEP 4: Resend accepted email", { messageId: data?.id });
    log("STEP 5: Email process completed successfully");

  } catch (error) {
    console.error(`[Password Reset Email] ${new Date().toISOString()} - FAILED:`, error);
    throw error;
  }
}
