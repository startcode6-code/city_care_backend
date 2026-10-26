import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function testEmail() {
    try {

        console.log("SMTP_HOST:", process.env.SMTP_HOST);
        console.log("SMTP_PORT:", process.env.SMTP_PORT);
        console.log("SMTP_USER:", process.env.SMTP_USER);
        console.log(
            "SMTP_PASS length:",
            process.env.SMTP_PASS?.replace(/\s/g, "").length
        );

        await transporter.verify();

        console.log("SMTP connection successful!");

        const result = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER,
            subject: "K.P. Sinha Memorial Hospital - SMTP Test",
            text: "Your SMTP configuration is working correctly.",
        });

        console.log("Email sent successfully!");
        console.log("Message ID:", result.messageId);
    } catch (error) {
        console.error("SMTP Error:", error);
    }
}

testEmail();