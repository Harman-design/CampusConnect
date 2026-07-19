const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();
  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}

function passwordResetEmailTemplate(name, resetUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2>CampusConnect Password Reset</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in ${process.env.RESET_TOKEN_EXPIRES_MIN || 30} minutes.</p>
      <p>
        <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>— CampusConnect Team, SRM Ramapuram</p>
    </div>
  `;
}

module.exports = { sendEmail, passwordResetEmailTemplate };
