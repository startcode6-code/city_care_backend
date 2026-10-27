
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost || !smtpUser || !smtpPass) {
  throw new Error("SMTP configuration is incomplete.");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

type PasswordResetEmailParams = {
  to: string;
  resetLink: string;
};


export async function sendPasswordResetEmail({
  to,
  resetLink,
}: PasswordResetEmailParams) {
  const debugLog = (step: string, details?: unknown) => {
    console.log(
      `[Password Reset Email] ${new Date().toISOString()} - ${step}`,
      details ?? ""
    );
  };

  try {
    debugLog("STEP 1: Email function started");

    // STEP 2: Check SMTP_FROM
    const from = process.env.SMTP_FROM;

    debugLog("STEP 2: Checking SMTP_FROM", {
      configured: Boolean(from),
    });

    if (!from) {
      throw new Error("SMTP_FROM is not configured.");
    }

    // STEP 3: Validate reset URL
    const allowedOrigin = "https://city-care-kohl.vercel.app";

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(resetLink);
      debugLog("STEP 3: Reset URL parsed", {
        origin: parsedUrl.origin,
        pathname: parsedUrl.pathname,
        hasToken: parsedUrl.searchParams.has("token"),
      });
    } catch {
      throw new Error("Invalid password reset link.");
    }

    if (
      parsedUrl.origin !== allowedOrigin ||
      parsedUrl.pathname !== "/admin/reset-password"
    ) {
      throw new Error("Invalid password reset link.");
    }

    debugLog("STEP 4: Reset URL validation successful");

    // STEP 5: Check SMTP configuration (never log credentials)
    debugLog("STEP 5: Checking SMTP configuration", {
      host: process.env.SMTP_HOST || "NOT SET",
      port: process.env.SMTP_PORT || "NOT SET",
      userConfigured: Boolean(process.env.SMTP_USER),
      passConfigured: Boolean(process.env.SMTP_PASS),
      secure: process.env.SMTP_SECURE || "NOT SET",
    });

    // STEP 6: Verify SMTP connection
    debugLog("STEP 6: Starting SMTP transporter verification");

    try {
      await transporter.verify();
      debugLog("STEP 7: SMTP transporter verification successful");
    } catch (smtpError) {
      console.error(
        "[Password Reset Email] SMTP VERIFICATION FAILED:",
        smtpError
      );
      throw smtpError;
    }

    // STEP 8: Send email
    debugLog("STEP 8: Sending email", {
      recipientConfigured: Boolean(to),
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject: "Reset Your Hospital Admin Password",
      text: `
Hello,

We received a request to reset your admin account password.

Click the link below to reset your password:

${resetLink}

This link will expire in 15 minutes.

If you did not request a password reset, you can ignore this email.

K.P. Sinha Memorial Hospital
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your admin account password.</p>
          <a href="${resetLink}"
             style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
          <p>K.P. Sinha Memorial Hospital</p>
        </div>
      `,
    });

    // STEP 9: Email accepted by SMTP server
    debugLog("STEP 9: SMTP sendMail completed", {
      acceptedCount: info.accepted.length,
      rejectedCount: info.rejected.length,
      response: info.response,
      messageId: info.messageId,
    });

    if (info.rejected.length > 0 || info.accepted.length === 0) {
      throw new Error("SMTP server did not accept the recipient.");
    }

    debugLog("STEP 10: Email sending completed");
  } catch (error) {
    console.error(
      `[Password Reset Email] ${new Date().toISOString()} - FAILED:`,
      error
    );

    throw error;
  }
}
