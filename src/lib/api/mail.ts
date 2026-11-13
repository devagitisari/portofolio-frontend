import { createTransport } from "nodemailer";

let transporter: ReturnType<typeof createTransport> | null = null;

function getTransporter(): ReturnType<typeof createTransport> | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  if (!transporter) {
    transporter = createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user, pass },
    });
  }

  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD);
}

export async function sendMail(options: { to: string; subject: string; html: string; text?: string }): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("SMTP is not configured — skipping email:", options.subject);
    return false;
  }

  const from = process.env.MAIL_FROM_ADDRESS ?? process.env.SMTP_USERNAME ?? "no-reply@example.com";
  const fromName = process.env.MAIL_FROM_NAME ?? "Portofolio";

  await mailer.sendMail({
    from: `"${fromName}" <${from}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  return true;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/** Mirrors resources/views/mail/inquiry-reply.blade.php. */
export function renderInquiryReplyEmail(options: {
  name: string;
  subject: string;
  originalMessage: string;
  replyMessage: string;
  siteName: string;
}): string {
  const { name, subject, originalMessage, replyMessage, siteName } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reply to Your Inquiry</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);">
  <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(236, 72, 153, 0.15);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #ec4899; margin: 0; font-size: 28px; font-weight: 700;">Hello ${escapeHtml(name)}!</h1>
      <p style="color: #666; margin: 5px 0 0; font-size: 14px;">Thank you for reaching out</p>
    </div>
    <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 25px; border-radius: 15px; border: 2px solid #fbcfe8; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; color: #ec4899; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">My Response</p>
      <p style="margin: 0; white-space: pre-wrap; color: #374151; font-size: 15px; line-height: 1.8;">${escapeHtml(replyMessage)}</p>
    </div>
    <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 2px dashed #fbcfe8;">
      <p style="margin: 0; color: #ec4899; font-weight: 600; font-size: 16px;">Best regards,</p>
      <p style="margin: 5px 0 0; color: #374151; font-weight: 700; font-size: 18px;">${escapeHtml(siteName)}</p>
    </div>
    <div style="margin-top: 35px; padding: 20px; background: #f9fafb; border-radius: 12px; border-left: 4px solid #e5e7eb;">
      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Original Message</p>
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
        <p style="margin: 0 0 8px 0; color: #374151; font-size: 13px; font-weight: 600;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p style="margin: 0; white-space: pre-wrap; color: #374151; font-size: 14px; line-height: 1.6;">${escapeHtml(originalMessage)}</p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #fbcfe8;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This email was sent from ${escapeHtml(siteName)}</p>
    </div>
  </div>
</body>
</html>`;
}

/** Mirrors App/Notifications/NewInquiryNotification. */
export function renderNewInquiryEmail(options: {
  name: string;
  email: string;
  subject: string;
  message: string;
  siteName: string;
}): string {
  const { name, email, subject, message, siteName } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Inquiry</title></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fdf2f8;">
  <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(236, 72, 153, 0.15);">
    <h1 style="color: #ec4899; margin: 0 0 6px 0; font-size: 26px;">New Inquiry</h1>
    <p style="color: #666; margin: 0 0 25px 0; font-size: 14px;">Someone reached out through ${escapeHtml(siteName)}.</p>
    <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p style="margin: 0; white-space: pre-wrap; color: #374151; font-size: 14px;">${escapeHtml(message)}</p>
    </div>
  </div>
</body>
</html>`;
}
