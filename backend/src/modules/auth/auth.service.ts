import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";

import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../lib/errors.js";
import { generateSecureToken } from "../../lib/id.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../lib/mailer.js";
import { dispatchUserNotification } from "../../lib/notifications.js";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.schema.js";

// ─── Register ───────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  // Check if email already taken
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
  const emailVerifyToken = generateSecureToken();

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      accountType: input.accountType,
      emailVerifyToken,
      profile: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: `${input.firstName} ${input.lastName}`,
          companyName: input.companyName ?? null,
          avatarHash: `${input.firstName[0]}${input.lastName[0]}`.toUpperCase(),
        },
      },
    },
    include: { profile: true },
  });

  // Fire and forget: delivery problems are logged by the mailer, never thrown.
  void sendVerificationEmail(user.email, emailVerifyToken);

  // Create default wallets for the user
  const defaultCurrencies = ["USD", "EUR", "BRL", "USDT"];
  for (const code of defaultCurrencies) {
    const currency = await prisma.currency.findUnique({ where: { code } });
    if (currency) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          currencyId: currency.id,
          type: currency.type === "CRYPTO" ? "CRYPTO" : "FIAT",
          label: `${code} Wallet`,
          isDefault: code === "USD",
        },
      });
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      resource: "user",
      resourceId: user.id,
      details: { event: "registration" },
    },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.profile?.firstName,
    lastName: user.profile?.lastName,
    accountType: user.accountType,
    emailVerified: user.emailVerified,
  };
}

// ─── Login ──────────────────────────────────────────────────────────────────

export async function loginUser(input: LoginInput, meta: { ip?: string; userAgent?: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { profile: true },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password.");
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new UnauthorizedError(
      `Account locked. Try again after ${user.lockedUntil.toISOString()}.`,
    );
  }

  // Check account status
  if (user.status === "SUSPENDED" || user.status === "BLOCKED" || user.status === "CLOSED") {
    throw new UnauthorizedError("Account is not active. Contact support.");
  }

  // Verify password
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    // Increment failed login counter
    const failedLogins = user.failedLogins + 1;
    const updateData: { failedLogins: number; lockedUntil?: Date } = { failedLogins };

    // Lock after 5 consecutive failures for 15 minutes
    if (failedLogins >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.failedLogins = 0;
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });
    throw new UnauthorizedError("Invalid email or password.");
  }

  // Check 2FA if enabled
  if (user.twoFactorEnabled) {
    if (!input.twoFactorCode) {
      // Return a partial response that tells the client to ask for 2FA code
      return { requiresTwoFactor: true as const, userId: user.id };
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestError("2FA is misconfigured. Contact support.");
    }

    const totp = new OTPAuth.TOTP({
      issuer: "Pagwave",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const valid2FA = totp.validate({ token: input.twoFactorCode, window: 1 }) !== null;
    if (!valid2FA) {
      throw new UnauthorizedError("Invalid 2FA code.");
    }
  }

  // Reset failed logins and update login metadata
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: meta.ip ?? null,
      loginCount: { increment: 1 },
      status: user.status === "PENDING_VERIFICATION" && user.emailVerified ? "ACTIVE" : user.status,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      resource: "session",
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  void dispatchUserNotification({
    userId: user.id,
    category: "securityNotices",
    type: "SECURITY",
    title: "Novo login na sua conta pagwave",
    body: meta.ip
      ? `Acesso realizado a partir do IP ${meta.ip}. Se não foi você, altere sua senha imediatamente.`
      : "Um novo acesso à sua conta foi detectado.",
    url: "/settings",
    emailSubject: "Pagwave · Alerta de segurança: novo login detectado",
  });

  return {
    requiresTwoFactor: false as const,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      accountType: user.accountType,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            displayName: user.profile.displayName,
            avatarUrl: user.profile.avatarUrl,
            avatarHash: user.profile.avatarHash,
            kycStatus: user.profile.kycStatus,
            kycLevel: user.profile.kycLevel,
          }
        : null,
    },
  };
}

// ─── Create Session ─────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  refreshToken: string,
  meta: { ip?: string; userAgent?: string },
) {
  // Expire in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      expiresAt,
    },
  });
}

// ─── Invalidate Session ─────────────────────────────────────────────────────

export async function invalidateSession(refreshToken: string) {
  await prisma.session.updateMany({
    where: { refreshToken },
    data: { isActive: false },
  });
}

// ─── Invalidate All Sessions (logout everywhere) ───────────────────────────

export async function invalidateAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
}

// ─── Validate Refresh Token ─────────────────────────────────────────────────

export async function validateRefreshToken(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: { include: { profile: true } } },
  });

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired refresh token.");
  }

  if (["SUSPENDED", "BLOCKED", "CLOSED"].includes(session.user.status)) {
    throw new UnauthorizedError("Account is not active. Contact support.");
  }

  return session.user;
}

// ─── Verify Email ───────────────────────────────────────────────────────────

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token, emailVerified: false },
  });

  if (!user) {
    throw new BadRequestError("Invalid or already used verification token.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      status: "ACTIVE",
    },
  });

  return { email: user.email };
}

// ─── Resend verification e-mail ─────────────────────────────────────────────

export async function resendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  if (user.emailVerified) {
    throw new BadRequestError("This e-mail address is already verified.");
  }

  // A fresh token invalidates the previous link.
  const emailVerifyToken = generateSecureToken();
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken } });

  void sendVerificationEmail(user.email, emailVerifyToken);
}

// ─── Forgot Password ───────────────────────────────────────────────────────

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always return success to prevent email enumeration
  if (!user) return { sent: true };

  const resetToken = generateSecureToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: expires,
    },
  });

  void sendPasswordResetEmail(user.email, resetToken);

  return { sent: true };
}

// ─── Reset Password ─────────────────────────────────────────────────────────

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: input.token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new BadRequestError("Invalid or expired reset token.");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Invalidate all sessions for security
  await invalidateAllSessions(user.id);

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PASSWORD_CHANGE",
      resource: "user",
      resourceId: user.id,
      details: { method: "reset_token" },
    },
  });

  void dispatchUserNotification({
    userId: user.id,
    category: "securityNotices",
    type: "SECURITY",
    title: "Senha redefinida",
    body: "Sua senha foi redefinida e todas as sessões anteriores foram encerradas.",
    url: "/settings",
    emailSubject: "Pagwave · Senha redefinida",
  });

  return { email: user.email };
}

// ─── Change Password ────────────────────────────────────────────────────────

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Current password is incorrect.");

  const passwordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "PASSWORD_CHANGE",
      resource: "user",
      resourceId: userId,
      details: { method: "manual" },
    },
  });

  void dispatchUserNotification({
    userId,
    category: "securityNotices",
    type: "SECURITY",
    title: "Senha alterada",
    body: "A senha da sua conta pagwave foi alterada com sucesso.",
    url: "/settings",
    emailSubject: "Pagwave · Senha alterada",
  });
}

// ─── 2FA Setup ──────────────────────────────────────────────────────────────

export async function setup2FA(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  if (user.twoFactorEnabled) {
    throw new BadRequestError("2FA is already enabled.");
  }

  const secret = new OTPAuth.Secret({ size: 20 });

  const totp = new OTPAuth.TOTP({
    issuer: "Pagwave",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  // Store the secret temporarily (will be confirmed when user verifies)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 },
  });

  const otpauthUri = totp.toString();

  return {
    secret: secret.base32,
    uri: otpauthUri,
    otpauthUri,
    qrCodeUrl: otpauthUri,
  };
}

export async function confirm2FA(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new BadRequestError("2FA setup not started.");
  }

  const totp = new OTPAuth.TOTP({
    issuer: "Pagwave",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
  });

  const valid = totp.validate({ token: code, window: 1 }) !== null;
  if (!valid) {
    throw new BadRequestError("Invalid 2FA code. Please try again.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "TWO_FA_ENABLE",
      resource: "user",
      resourceId: userId,
    },
  });

  void dispatchUserNotification({
    userId,
    category: "securityNotices",
    type: "SECURITY",
    title: "2FA ativado",
    body: "A autenticação em duas etapas foi ativada na sua conta.",
    url: "/settings",
    emailSubject: "Pagwave · 2FA ativado",
  });

  return { enabled: true };
}

export async function disable2FA(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid password.");

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "TWO_FA_DISABLE",
      resource: "user",
      resourceId: userId,
    },
  });

  void dispatchUserNotification({
    userId,
    category: "securityNotices",
    type: "SECURITY",
    title: "2FA desativado",
    body: "A autenticação em duas etapas da sua conta foi desativada.",
    url: "/settings",
    emailSubject: "Pagwave · 2FA desativado",
  });
}
