
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
    const from = process.env.SMTP_FROM;

    if (!from) {
        throw new Error("SMTP_FROM is not configured.");
    }

    if (!resetLink.startsWith("https://") && !resetLink.startsWith("http://localhost")) {
        throw new Error("Invalid password reset link.");
    }

    await transporter.sendMail({
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
      <div style="
        font-family: Arial, sans-serif;
        max-width: 560px;
        margin: 0 auto;
        padding: 32px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      ">
        <h2 style="color: #111827;">
          Reset Your Password
        </h2>

        <p style="color: #4b5563; line-height: 1.6;">
          We received a request to reset your admin account password.
          Click the button below to continue.
        </p>

        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
          "
        >
          Reset Password
        </a>

        <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
          This link will expire in 15 minutes.
        </p>

        <p style="color: #6b7280; font-size: 14px;">
          If you did not request a password reset, you can safely ignore
          this email.
        </p>

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <p style="color: #9ca3af; font-size: 12px;">
          K.P. Sinha Memorial Hospital
        </p>
      </div>
    `,
    });
}
