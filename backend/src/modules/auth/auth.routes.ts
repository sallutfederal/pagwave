import type { FastifyInstance } from "fastify";

import { authGuard } from "../../middleware/auth.js";
import {
  changePasswordSchema,
  enable2FASchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schema.js";
import {
  changePassword,
  confirm2FA,
  createSession,
  disable2FA,
  invalidateAllSessions,
  invalidateSession,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  setup2FA,
  validateRefreshToken,
  verifyEmail,
} from "./auth.service.js";

export async function authRoutes(app: FastifyInstance) {
  // ─── POST /auth/register ────────────────────────────────────────────────
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await registerUser(body);

    reply.status(201).send({
      message: "Account created successfully. Check your email for verification.",
      user: result,
    });
  });

  // ─── POST /auth/login ──────────────────────────────────────────────────
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const meta = {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    };

    const result = await loginUser(body, meta);

    if (result.requiresTwoFactor) {
      return reply.status(200).send({
        requiresTwoFactor: true,
        message: "2FA code required.",
      });
    }

    // Generate JWT tokens
    const accessToken = app.jwt.sign(
      { id: result.user.id, email: result.user.email, role: result.user.role },
      { expiresIn: "15m" },
    );

    const refreshToken = app.jwt.sign(
      { id: result.user.id, type: "refresh" },
      { expiresIn: "7d" },
    );

    // Persist session
    await createSession(result.user.id, refreshToken, meta);

    reply.send({
      accessToken,
      refreshToken,
      user: result.user,
    });
  });

  // ─── POST /auth/refresh ────────────────────────────────────────────────
  app.post("/refresh", async (request, reply) => {
    const { refreshToken } = refreshTokenSchema.parse(request.body);
    const user = await validateRefreshToken(refreshToken);

    // Rotate: invalidate old, issue new
    await invalidateSession(refreshToken);

    const newAccessToken = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: "15m" },
    );

    const newRefreshToken = app.jwt.sign(
      { id: user.id, type: "refresh" },
      { expiresIn: "7d" },
    );

    await createSession(user.id, newRefreshToken, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    reply.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  // ─── POST /auth/logout ─────────────────────────────────────────────────
  app.post("/logout", { preHandler: [authGuard] }, async (request, reply) => {
    const { refreshToken } = refreshTokenSchema.parse(request.body);
    await invalidateSession(refreshToken);
    reply.send({ message: "Logged out successfully." });
  });

  // ─── POST /auth/logout-all ─────────────────────────────────────────────
  app.post("/logout-all", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string };
    await invalidateAllSessions(user.id);
    reply.send({ message: "All sessions terminated." });
  });

  // ─── POST /auth/verify-email ───────────────────────────────────────────
  app.post("/verify-email", async (request, reply) => {
    const { token } = verifyEmailSchema.parse(request.body);
    const result = await verifyEmail(token);
    reply.send({ message: "Email verified successfully.", email: result.email });
  });

  // ─── POST /auth/forgot-password ────────────────────────────────────────
  app.post("/forgot-password", async (request, reply) => {
    const body = forgotPasswordSchema.parse(request.body);
    await requestPasswordReset(body);
    // Always returns success to prevent email enumeration
    reply.send({ message: "If this email exists, a reset link has been sent." });
  });

  // ─── POST /auth/reset-password ─────────────────────────────────────────
  app.post("/reset-password", async (request, reply) => {
    const body = resetPasswordSchema.parse(request.body);
    await resetPassword(body);
    reply.send({ message: "Password reset successfully. Please log in." });
  });

  // ─── POST /auth/change-password ────────────────────────────────────────
  app.post("/change-password", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string };
    const body = changePasswordSchema.parse(request.body);
    await changePassword(user.id, body);
    reply.send({ message: "Password changed successfully." });
  });

  // ─── GET /auth/me ──────────────────────────────────────────────────────
  app.get("/me", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string; email: string; role: string };
    // Re-fetch full profile from DB
    const { prisma } = await import("../../config/database.js");
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    if (!fullUser) {
      return reply.status(404).send({ error: "User not found" });
    }

    reply.send({
      id: fullUser.id,
      email: fullUser.email,
      role: fullUser.role,
      status: fullUser.status,
      accountType: fullUser.accountType,
      emailVerified: fullUser.emailVerified,
      twoFactorEnabled: fullUser.twoFactorEnabled,
      profile: fullUser.profile,
    });
  });

  // ─── POST /auth/2fa/setup ─────────────────────────────────────────────
  app.post("/2fa/setup", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string };
    const result = await setup2FA(user.id);
    reply.send(result);
  });

  // ─── POST /auth/2fa/confirm ───────────────────────────────────────────
  app.post("/2fa/confirm", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string };
    const { code } = enable2FASchema.parse(request.body);
    const result = await confirm2FA(user.id, code);
    reply.send({ message: "2FA enabled successfully.", ...result });
  });

  // ─── POST /auth/2fa/disable ───────────────────────────────────────────
  app.post("/2fa/disable", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string };
    const { password } = request.body as { password: string };
    await disable2FA(user.id, password);
    reply.send({ message: "2FA disabled." });
  });
}
