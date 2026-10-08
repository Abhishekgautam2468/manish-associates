import nodemailer from 'nodemailer';

let transport = null;

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transport;
}

export async function sendOtpEmail(to, code, minutes) {
  const subject = `${code} is your Manish Associates verification code`;
  const text = [
    `Your code to reset the dashboard password is ${code}.`,
    `It expires in ${minutes} minutes.`,
    '',
    "If you didn't ask to reset your password, you can ignore this email. Your password won't change.",
  ].join('\n');

  const mailer = getTransport();
  if (!mailer) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured. Set SMTP_HOST in server/.env.');
    }
    console.log(`\n[dev] SMTP not configured. Password reset code for ${to}: ${code}\n`);
    return;
  }

  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
}
