import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import {
  FEE_TRANSACTION_TYPES,
  SUPPORTED_FEE_CURRENCIES,
  getAllUsersFeeOverridesMap,
  getUserFeeOverrides,
  normalizeFeeCurrency,
  setUserFeeOverrides,
} from "../../lib/fees.js";
import { adminGuard } from "../../middleware/auth.js";
import { dispatchUserNotification } from "../../lib/notifications.js";
import { confirmDeposit, rejectDeposit } from "../wallets/wallet.service.js";

const updateAdminUserSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "BLOCKED", "CLOSED"]).optional(),
  kycStatus: z.enum(["NOT_STARTED", "PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "EXPIRED"]).optional(),
  kycLevel: z.coerce.number().int().min(0).max(3).optional(),
});

const reviewKycSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  kycLevel: z.coerce.number().int().min(0).max(3).optional(),
  reviewNote: z.string().trim().max(500).optional(),
});

const updateFeeSchema = z.object({
  transactionType: z.enum(["DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT", "EXCHANGE"]),
  currencyCode: z.string().trim().min(1).max(10),
  flatFee: z.coerce.number().min(0),
  percentFee: z.coerce.number().min(0).max(1),
  minFee: z.coerce.number().min(0).optional(),
  maxFee: z.coerce.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

const userFeeRuleSchema = z.object({
  transactionType: z.enum(FEE_TRANSACTION_TYPES),
  currencyCode: z.string().trim().min(1).max(10),
  flatFee: z.coerce.number().min(0),
  percentFee: z.coerce.number().min(0).max(1),
  minFee: z.coerce.number().min(0).default(0),
  maxFee: z.coerce.number().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

const putUserFeeOverridesSchema = z.object({
  rules: z.array(userFeeRuleSchema).max(60),
  note: z.string().trim().max(240).optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", adminGuard);

  app.get("/users", async () => {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        gatewayCredential: true,
        _count: {
          select: {
            wallets: true,
            cards: true,
            kycDocuments: true,
            gatewayActivities: true,
            savedPayoutKeys: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      users: users.map((u) => ({
        userId: u.id,
        email: u.email,
        name:
          u.profile?.displayName ||
          `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.trim() ||
          u.email,
        role: u.role,
        status: u.status,
        suspended: u.status === "SUSPENDED" || u.status === "BLOCKED",
        emailVerified: u.emailVerified,
        twoFactorEnabled: u.twoFactorEnabled,
        kycStatus: u.profile?.kycStatus ?? "NOT_STARTED",
        kycLevel: u.profile?.kycLevel ?? 0,
        lastSeenAt: (u.lastLoginAt ?? u.updatedAt).toISOString(),
        apiKeyPrefix: u.gatewayCredential?.clientId ?? null,
        apiRequestCount: u.gatewayCredential?.requestCount ?? 0,
        txCount: u._count.gatewayActivities,
        beneficiaryCount: u._count.savedPayoutKeys,
        walletCount: u._count.wallets,
        cardCount: u._count.cards,
        kycDocumentCount: u._count.kycDocuments,
      })),
    };
  });

  app.patch("/users/:id", async (request) => {
    const admin = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };
    const body = updateAdminUserSchema.parse(request.body);

    const target = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!target) throw new NotFoundError("User");

    if (target.id === admin.id && body.status && body.status !== "ACTIVE") {
      throw new BadRequestError("Você não pode suspender a própria conta de administrador.");
    }

    if (body.role || body.status) {
      await prisma.user.update({
        where: { id },
        data: {
          ...(body.role ? { role: body.role } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
      });
    }

    if (body.status === "SUSPENDED" || body.status === "BLOCKED" || body.status === "CLOSED") {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    if (body.kycStatus !== undefined || body.kycLevel !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId: id },
        update: {
          ...(body.kycStatus ? { kycStatus: body.kycStatus } : {}),
          ...(body.kycLevel !== undefined ? { kycLevel: body.kycLevel } : {}),
          ...(body.kycStatus === "APPROVED" ? { kycApprovedAt: new Date() } : {}),
        },
        create: {
          userId: id,
          firstName: target.email.split("@")[0] ?? "User",
          lastName: "",
          kycStatus: body.kycStatus ?? "NOT_STARTED",
          kycLevel: body.kycLevel ?? 0,
          kycApprovedAt: body.kycStatus === "APPROVED" ? new Date() : null,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "ADMIN_ACTION",
        resource: "user",
        resourceId: id,
        details: body,
      },
    });

    const refreshed = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: { profile: true },
    });

    return {
      user: {
        userId: refreshed.id,
        email: refreshed.email,
        role: refreshed.role,
        status: refreshed.status,
        suspended: refreshed.status === "SUSPENDED" || refreshed.status === "BLOCKED",
        kycStatus: refreshed.profile?.kycStatus ?? "NOT_STARTED",
        kycLevel: refreshed.profile?.kycLevel ?? 0,
      },
    };
  });

  app.get("/kyc", async () => {
    const docs = await prisma.kycDocument.findMany({
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        reviewNote: true,
        createdAt: true,
        reviewedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      documents: docs.map((d) => ({
        id: d.id,
        userId: d.userId,
        userEmail: d.user.email,
        userName:
          d.user.profile?.displayName ||
          `${d.user.profile?.firstName ?? ""} ${d.user.profile?.lastName ?? ""}`.trim() ||
          d.user.email,
        type: d.type,
        status: d.status,
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        reviewNote: d.reviewNote,
        createdAt: d.createdAt.toISOString(),
        reviewedAt: d.reviewedAt?.toISOString() ?? null,
      })),
    };
  });

  app.patch("/kyc/:docId", async (request) => {
    const admin = request.user as { id: string };
    const { docId } = request.params as { docId: string };
    const body = reviewKycSchema.parse(request.body);

    const doc = await prisma.kycDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundError("KYC document");

    const updated = await prisma.kycDocument.update({
      where: { id: docId },
      data: {
        status: body.status,
        reviewedBy: admin.id,
        reviewNote: body.reviewNote ?? null,
        reviewedAt: new Date(),
      },
    });

    const nextLevel =
      body.status === "APPROVED" ? (body.kycLevel ?? 2) : 0;

    await prisma.userProfile.updateMany({
      where: { userId: doc.userId },
      data: {
        kycStatus: body.status,
        kycLevel: nextLevel,
        ...(body.status === "APPROVED" ? { kycApprovedAt: new Date() } : {}),
      },
    });

    void dispatchUserNotification({
      userId: doc.userId,
      category: "always",
      type: "KYC",
      title: body.status === "APPROVED" ? "KYC Aprovado" : "KYC Rejeitado",
      body:
        body.status === "APPROVED"
          ? `Sua verificação de identidade foi aprovada (nível ${nextLevel}).`
          : `Seu documento foi rejeitado${body.reviewNote ? `: ${body.reviewNote}` : "."}`,
      url: "/settings",
      emailSubject: body.status === "APPROVED" ? "Pagwave · KYC aprovado" : "Pagwave · KYC rejeitado",
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: body.status === "APPROVED" ? "KYC_APPROVE" : "KYC_REJECT",
        resource: "kyc_document",
        resourceId: docId,
        details: { targetUserId: doc.userId, reviewNote: body.reviewNote },
      },
    });

    return { document: updated };
  });

  app.get("/fees", async () => {
    const [fees, settings, dbCurrencies, users, overridesMap] = await Promise.all([
      prisma.feeConfig.findMany({
        orderBy: [{ currencyCode: "asc" }, { transactionType: "asc" }],
      }),
      prisma.platformSetting.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default" },
      }),
      prisma.currency.findMany({
        where: { isActive: true },
        select: { code: true, name: true, symbol: true, decimals: true, type: true },
        orderBy: { code: "asc" },
      }),
      prisma.user.findMany({
        include: {
          profile: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
              kycStatus: true,
              kycLevel: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      getAllUsersFeeOverridesMap(),
    ]);

    const currencyCodes: string[] = [...SUPPORTED_FEE_CURRENCIES];
    for (const c of dbCurrencies) {
      const upper = c.code.toUpperCase();
      if (!currencyCodes.includes(upper)) currencyCodes.push(upper);
    }

    return {
      fees: fees.map((f) => ({
        id: f.id,
        transactionType: f.transactionType,
        currencyCode: f.currencyCode,
        flatFee: Number(f.flatFee),
        percentFee: Number(f.percentFee),
        minFee: Number(f.minFee),
        maxFee: f.maxFee !== null ? Number(f.maxFee) : null,
        isActive: f.isActive,
        updatedAt: f.updatedAt.toISOString(),
      })),
      platformFeeBps: settings.feeBps,
      currencies: currencyCodes,
      userOverrides: users.map((u) => {
        const override = overridesMap.get(u.id);
        return {
          userId: u.id,
          email: u.email,
          name:
            u.profile?.displayName ||
            `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.trim() ||
            u.email,
          role: u.role,
          status: u.status,
          kycStatus: u.profile?.kycStatus ?? "NOT_STARTED",
          kycLevel: u.profile?.kycLevel ?? 0,
          rules: override?.rules ?? [],
          note: override?.note ?? "",
          updatedAt: override?.updatedAt ?? null,
        };
      }),
    };
  });

  app.patch("/fees", async (request) => {
    const admin = request.user as { id: string };
    const body = updateFeeSchema.parse(request.body);
    const currencyCode = normalizeFeeCurrency(body.currencyCode);
    if (!currencyCode) {
      throw new BadRequestError("Moeda inválida.");
    }

    const fee = await prisma.feeConfig.upsert({
      where: {
        transactionType_currencyCode: {
          transactionType: body.transactionType,
          currencyCode,
        },
      },
      update: {
        flatFee: body.flatFee,
        percentFee: body.percentFee,
        minFee: body.minFee ?? 0,
        maxFee: body.maxFee === undefined ? undefined : body.maxFee,
        isActive: body.isActive ?? true,
      },
      create: {
        transactionType: body.transactionType,
        currencyCode,
        flatFee: body.flatFee,
        percentFee: body.percentFee,
        minFee: body.minFee ?? 0,
        maxFee: body.maxFee ?? null,
        isActive: body.isActive ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "ADMIN_ACTION",
        resource: "fee_config",
        resourceId: fee.id,
        details: body,
      },
    });

    return {
      fee: {
        id: fee.id,
        transactionType: fee.transactionType,
        currencyCode: fee.currencyCode,
        flatFee: Number(fee.flatFee),
        percentFee: Number(fee.percentFee),
        minFee: Number(fee.minFee),
        maxFee: fee.maxFee !== null ? Number(fee.maxFee) : null,
        isActive: fee.isActive,
        updatedAt: fee.updatedAt.toISOString(),
      },
    };
  });

  app.get("/fees/user/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundError("User");
    const override = await getUserFeeOverrides(userId);
    return { userId, ...override };
  });

  app.put("/fees/user/:userId", async (request) => {
    const admin = request.user as { id: string };
    const { userId } = request.params as { userId: string };
    const body = putUserFeeOverridesSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundError("User");

    const normalizedRules = body.rules.map((r) => ({
      transactionType: r.transactionType,
      currencyCode: normalizeFeeCurrency(r.currencyCode),
      flatFee: r.flatFee,
      percentFee: r.percentFee,
      minFee: r.minFee ?? 0,
      maxFee: r.maxFee ?? null,
      isActive: r.isActive ?? true,
    }));

    const saved = await setUserFeeOverrides(userId, normalizedRules, admin.id, body.note);

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "ADMIN_ACTION",
        resource: "admin_user_fee_update",
        resourceId: userId,
        details: {
          targetUserId: userId,
          targetEmail: user.email,
          ruleCount: saved.rules.length,
          note: saved.note,
        },
      },
    });

    if (saved.rules.length > 0) {
      void dispatchUserNotification({
        userId,
        category: "securityNotices",
        type: "SYSTEM",
        title: "Taxas da conta atualizadas",
        body: "Um administrador atualizou sua tabela personalizada de taxas (incluindo saques). Consulte a página Taxas.",
        url: "/fees",
      });
    }

    return { ok: true, userId, ...saved };
  });

  app.delete("/fees/user/:userId", async (request) => {
    const admin = request.user as { id: string };
    const { userId } = request.params as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundError("User");

    const saved = await setUserFeeOverrides(userId, [], admin.id, "Resetado para padrão da plataforma");

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "ADMIN_ACTION",
        resource: "admin_user_fee_reset",
        resourceId: userId,
        details: { targetUserId: userId, targetEmail: user.email },
      },
    });

    return { ok: true, userId, ...saved };
  });

  app.post("/deposits/:referenceId/confirm", async (request) => {
    const admin = request.user as { id: string };
    const { referenceId } = request.params as { referenceId: string };
    const body = z
      .object({ externalId: z.string().trim().max(255).optional() })
      .parse(request.body ?? {});

    return confirmDeposit(referenceId, admin.id, body);
  });

  app.post("/deposits/:referenceId/reject", async (request) => {
    const admin = request.user as { id: string };
    const { referenceId } = request.params as { referenceId: string };
    const body = z
      .object({ reason: z.string().trim().max(500).optional() })
      .parse(request.body ?? {});

    return rejectDeposit(referenceId, admin.id, body.reason);
  });
}

