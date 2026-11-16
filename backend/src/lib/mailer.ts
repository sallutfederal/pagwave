import nodemailer from 'nodemailer';

import { env } from '../config/env.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

type Mail = { to: string; subject: string; text: string };

/**
 * Sends an e-mail without ever failing the caller: a broken mail server must
 * not make sign-up or "forgot password" return a 500.
 *
 * Without SMTP configured, development prints the message to the console so
 * the verification/reset links can be copied. Production never prints them,
 * because the links are credentials.
 */
async function sendEmail({ to, subject, text }: Mail) {
  if (!transporter) {
    if (env.NODE_ENV === 'production') {
      console.warn(`[mail] SMTP is not configured; dropped "${subject}" for ${to}`);
    } else {
      console.info(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n${text}\n`);
    }
    return;
  }

  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, text });
  } catch (error) {
    console.error(`[mail] failed to send "${subject}" to ${to}`, error);
  }
}

export function sendVerificationEmail(to: string, token: string) {
  const link = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to,
    subject: 'Confirm your Pagwave account',
    text: `Welcome to Pagwave!\n\nConfirm your e-mail address to activate your account:\n${link}\n\nIf you did not create this account, you can ignore this message.`,
  });
}

export function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to,
    subject: 'Reset your Pagwave password',
    text: `We received a request to reset your password.\n\nChoose a new one here (valid for 1 hour):\n${link}\n\nIf you did not ask for this, your password is unchanged and you can ignore this message.`,
  });
}
