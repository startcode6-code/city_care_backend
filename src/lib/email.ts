
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

export async function sendPasswordResetEmail({ to, resetLink }: PasswordResetEmailParams) {
  const from = process.env.SMTP_FROM;

  if (!from) {
    throw new Error("SMTP_FROM is not configured.");
  }

  const allowedOrigin = "https://city-care-kohl.vercel.app";

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(resetLink);
  } catch {
    throw new Error("Invalid password reset link.");
  }

  if (parsedUrl.origin !== allowedOrigin || parsedUrl.pathname !== "/admin/reset-password") {
    throw new Error("Invalid password reset link.");
  }

  await transporter.sendMail({
    from, to, subject: "Reset Your Hospital Admin Password", text: `
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
}
