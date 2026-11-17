import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../../lib/errors.js";
import { authGuard } from "../../middleware/auth.js";
import { generateId } from "../../lib/id.js";
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
  resendVerificationEmail,
  resetPassword,
  setup2FA,
  validateRefreshToken,
  verifyEmail,
} from "./auth.service.js";

/** Credential endpoints are brute-force targets: much tighter than the global limit. */
const strictLimit = { max: 10, timeWindow: "1 minute" };

/**
 * Signs an access/refresh token pair. The refresh token carries a random `jti`:
 * two tokens signed for the same user in the same second would otherwise be
 * byte-identical and collide on the unique `sessions.refresh_token` column.
 */
function issueTokens(
  app: FastifyInstance,
  user: { id: string; email: string; role: string },
) {
  const accessToken = app.jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: "15m" },
  );

  const refreshToken = app.jwt.sign(
    { id: user.id, type: "refresh", jti: generateId() },
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
}

export async function authRoutes(app: FastifyInstance) {
  // ─── POST /auth/register ────────────────────────────────────────────────
  app.post("/register", { config: { rateLimit: strictLimit } }, async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await registerUser(body);

    reply.status(201).send({
      message: "Account created successfully. Check your email for verification.",
      user: result,
    });
  });

  // ─── POST /auth/login ──────────────────────────────────────────────────
  app.post("/login", { config: { rateLimit: strictLimit } }, async (request, reply) => {
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
    const { accessToken, refreshToken } = issueTokens(app, result.user);

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

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = issueTokens(app, user);

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
  // Authenticated by the refresh token itself (a bearer secret): the access
  // token is usually already expired by the time someone signs out.
  app.post("/logout", async (request, reply) => {
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

  // ─── POST /auth/resend-verification ────────────────────────────────────
  app.post(
    "/resend-verification",
    { preHandler: [authGuard], config: { rateLimit: strictLimit } },
    async (request, reply) => {
      const user = request.user as { id: string };
      await resendVerificationEmail(user.id);
      reply.send({ message: "Verification e-mail sent." });
    },
  );

  // ─── POST /auth/forgot-password ────────────────────────────────────────
  app.post("/forgot-password", { config: { rateLimit: strictLimit } }, async (request, reply) => {
    const body = forgotPasswordSchema.parse(request.body);
    await requestPasswordReset(body);
    // Always returns success to prevent email enumeration
    reply.send({ message: "If this email exists, a reset link has been sent." });
  });

  // ─── POST /auth/reset-password ─────────────────────────────────────────
  app.post("/reset-password", { config: { rateLimit: strictLimit } }, async (request, reply) => {
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

  // ─── PATCH /auth/profile ──────────────────────────────────────────────
  app.patch("/profile", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string; email: string };
    const body = z
      .object({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().max(100).optional(),
        displayName: z.string().trim().min(1).max(100).optional(),
        phone: z.string().trim().max(20).optional(),
        country: z.string().trim().max(3).optional(),
        companyName: z.string().trim().max(255).optional(),
        companyTaxId: z.string().trim().max(50).optional(),
        avatarUrl: z.string().trim().max(500).optional(),
      })
      .parse(request.body);

    const existing = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    const first = body.firstName ?? existing?.firstName ?? user.email.split("@")[0] ?? "User";
    const last = body.lastName ?? existing?.lastName ?? "";
    const displayName = body.displayName ?? `${first} ${last}`.trim();

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.displayName !== undefined || body.firstName !== undefined || body.lastName !== undefined
          ? { displayName }
          : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.country !== undefined ? { country: body.country.toUpperCase() || null } : {}),
        ...(body.companyName !== undefined ? { companyName: body.companyName || null } : {}),
        ...(body.companyTaxId !== undefined ? { companyTaxId: body.companyTaxId || null } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl || null } : {}),
      },
      create: {
        userId: user.id,
        firstName: first,
        lastName: last,
        displayName,
        phone: body.phone || null,
        country: body.country ? body.country.toUpperCase() : null,
        companyName: body.companyName || null,
        companyTaxId: body.companyTaxId || null,
        avatarUrl: body.avatarUrl || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SETTINGS_UPDATE",
        resource: "profile",
        resourceId: profile.id,
      },
    });

    reply.send({ profile });
  });

  // ─── GET / PATCH /auth/preferences ────────────────────────────────────
  app.get("/preferences", { preHandler: [authGuard] }, async (request) => {
    const user = request.user as { id: string };
    const preferences = await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    return { preferences };
  });

  app.patch("/preferences", { preHandler: [authGuard] }, async (request) => {
    const user = request.user as { id: string };
    const body = z
      .object({
        paymentAlerts: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        productRenewals: z.boolean().optional(),
        securityNotices: z.boolean().optional(),
      })
      .parse(request.body);

    const preferences = await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: body,
      create: { userId: user.id, ...body },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SETTINGS_UPDATE",
        resource: "preferences",
        resourceId: preferences.id,
        details: body,
      },
    });

    return { preferences };
  });

  // ─── GET / POST /auth/kyc ─────────────────────────────────────────────
  const ALLOWED_KYC_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);
  const MAX_KYC_FILE_BYTES = 5 * 1024 * 1024;

  app.get("/kyc", { preHandler: [authGuard] }, async (request) => {
    const user = request.user as { id: string };
    const [profile, documents] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: user.id } }),
      prisma.kycDocument.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          fileUrl: true,
          fileName: true,
          fileHash: true,
          mimeType: true,
          fileSize: true,
          reviewNote: true,
          reviewedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      kycStatus: profile?.kycStatus ?? "NOT_STARTED",
      kycLevel: profile?.kycLevel ?? 0,
      documents: documents.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        reviewedAt: d.reviewedAt?.toISOString() ?? null,
      })),
    };
  });

  app.get("/kyc/:docId/file", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string; role?: string };
    const { docId } = request.params as { docId: string };

    const doc = await prisma.kycDocument.findUnique({
      where: { id: docId },
      select: {
        id: true,
        userId: true,
        fileName: true,
        mimeType: true,
        fileData: true,
      },
    });

    if (!doc || !doc.fileData) {
      throw new NotFoundError("KYC file");
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (doc.userId !== user.id && !isAdmin) {
      throw new ForbiddenError("You do not have permission to view this document.");
    }

    const safeName = (doc.fileName ?? `kyc-${doc.id}`).replace(/[^a-zA-Z0-9._-]/g, "_");
    return reply
      .header("Content-Type", doc.mimeType ?? "application/octet-stream")
      .header("Content-Disposition", `inline; filename="${safeName}"`)
      .header("Cache-Control", "private, no-store")
      .send(Buffer.from(doc.fileData));
  });

  app.post(
    "/kyc",
    { preHandler: [authGuard], bodyLimit: 8 * 1024 * 1024 },
    async (request, reply) => {
      const user = request.user as { id: string; email: string };
      const body = z
        .object({
          type: z.enum([
            "IDENTITY_FRONT",
            "IDENTITY_BACK",
            "PASSPORT",
            "SELFIE",
            "PROOF_OF_ADDRESS",
            "CORPORATE_REGISTRATION",
            "TAX_ID",
          ]),
          fileUrl: z.string().trim().min(3).max(500).optional(),
          fileName: z.string().trim().min(1).max(255).optional(),
          mimeType: z.string().trim().max(50).optional(),
          fileBase64: z.string().trim().min(4).optional(),
          documentNumber: z.string().trim().max(100).optional(),
        })
        .parse(request.body);

      let fileBuffer: Buffer | null = null;
      let fileHash: string | null = null;
      let mimeType = body.mimeType ?? "application/octet-stream";
      let fileSize: number | null = null;

      if (body.fileBase64) {
        if (!ALLOWED_KYC_MIME_TYPES.has(mimeType)) {
          throw new BadRequestError("Formato inválido. Envie JPG, PNG, WebP ou PDF.");
        }
        fileBuffer = Buffer.from(body.fileBase64, "base64");
        if (fileBuffer.length === 0 || fileBuffer.length > MAX_KYC_FILE_BYTES) {
          throw new BadRequestError("O arquivo deve ter entre 1 byte e 5 MB.");
        }
        fileHash = createHash("sha256").update(fileBuffer).digest("hex");
        fileSize = fileBuffer.length;
      } else if (!body.fileUrl) {
        throw new BadRequestError("Envie um arquivo de documento válido.");
      }

      const created = await prisma.kycDocument.create({
        data: {
          userId: user.id,
          type: body.type,
          status: "PENDING",
          fileUrl: body.fileUrl ?? "pending://internal",
          fileName: body.fileName ?? null,
          fileHash,
          mimeType,
          fileSize,
          fileData: fileBuffer ? new Uint8Array(fileBuffer) : null,
          providerResult: body.documentNumber ? { documentNumber: body.documentNumber } : undefined,
        },
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          fileUrl: true,
          fileName: true,
          fileHash: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
        },
      });

      const doc = fileBuffer
        ? await prisma.kycDocument.update({
            where: { id: created.id },
            data: { fileUrl: `/api/auth/kyc/files/${created.id}` },
            select: {
              id: true,
              userId: true,
              type: true,
              status: true,
              fileUrl: true,
              fileName: true,
              fileHash: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
            },
          })
        : created;

      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          kycStatus: "PENDING",
          kycSubmittedAt: new Date(),
        },
        create: {
          userId: user.id,
          firstName: user.email.split("@")[0] ?? "User",
          lastName: "",
          kycStatus: "PENDING",
          kycSubmittedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "KYC_SUBMIT",
          resource: "kyc_document",
          resourceId: doc.id,
          details: { type: body.type, fileName: doc.fileName, fileSize: doc.fileSize },
        },
      });

      reply.status(201).send({
        document: {
          ...doc,
          createdAt: doc.createdAt.toISOString(),
        },
      });
    },
  );

  // ─── DELETE /auth/account ─────────────────────────────────────────────
  app.delete("/account", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as { id: string };
    const body = z.object({ password: z.string().min(1) }).parse(request.body ?? {});

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new BadRequestError("Account not found.");

    const valid = await bcrypt.compare(body.password, dbUser.passwordHash);
    if (!valid) throw new UnauthorizedError("Senha incorreta.");

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { status: "CLOSED" } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "ADMIN_ACTION",
          resource: "account",
          resourceId: user.id,
          details: { action: "SELF_CLOSE" },
        },
      }),
    ]);

    reply.send({ message: "Account closed successfully." });
  });
}
