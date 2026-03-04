import nodemailer from "nodemailer";
import { env } from "~/env";

/**
 * Returns a configured nodemailer transporter, or null if SMTP is not configured.
 */
function getTransporter() {
  if (!env.EMAIL_SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.EMAIL_SMTP_HOST,
    port: env.EMAIL_SMTP_PORT ?? 587,
    secure: (env.EMAIL_SMTP_PORT ?? 587) === 465,
    auth: env.EMAIL_SMTP_USER
      ? { user: env.EMAIL_SMTP_USER, pass: env.EMAIL_SMTP_PASS }
      : undefined,
  });
}

export interface ContactNotificationData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

/**
 * Sends an email notification when a contact form is submitted.
 * Silently no-ops if SMTP is not configured.
 */
export async function sendContactNotification(data: ContactNotificationData) {
  const transporter = getTransporter();
  if (!transporter || !env.EMAIL_TO) return;

  const subject = data.subject
    ? `New contact: ${data.subject}`
    : `New contact message from ${data.name}`;

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.EMAIL_SMTP_USER ?? "noreply@localhost",
    to:   env.EMAIL_TO,
    subject,
    text: [
      `From: ${data.name} <${data.email}>`,
      data.subject ? `Subject: ${data.subject}` : null,
      "",
      data.message,
    ].filter(Boolean).join("\n"),
    html: `
      <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
      ${data.subject ? `<p><strong>Subject:</strong> ${data.subject}</p>` : ""}
      <hr />
      <p style="white-space:pre-wrap">${data.message}</p>
    `,
  });
}
