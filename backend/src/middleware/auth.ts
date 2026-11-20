import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../config/database.js";

/**
 * Verifies the JWT access token from the Authorization header and ensures
 * the account is active and still holds an active session (so logout-all and
 * account closure revoke all devices immediately across PC, Android & iOS).
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{
      id: string;
      email: string;
      role: string;
      type?: string;
    }>();

    // Refresh tokens share the signing secret; they must never act as access tokens.
    if (payload.type === "refresh") {
      throw new Error("Refresh token used as access token");
    }

    const [dbUser, activeSessionCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.id },
        select: { status: true },
      }),
      prisma.session.count({
        where: {
          userId: payload.id,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    if (
      !dbUser ||
      ["SUSPENDED", "BLOCKED", "CLOSED"].includes(dbUser.status) ||
      activeSessionCount === 0
    ) {
      throw new Error("Session revoked or account inactive");
    }

    request.user = payload;
  } catch {
    reply.status(401).send({
      error: "Unauthorized",
      message: "Invalid, expired, or revoked access token.",
    });
  }
}

/**
 * Requires admin or super_admin role.
 */
export async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  await authGuard(request, reply);

  if (reply.sent) return; // authGuard already replied 401

  const user = request.user as { role: string };
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    reply.status(403).send({
      error: "Forbidden",
      message: "Admin access required.",
    });
  }
}

/**
 * Checks that the user has completed KYC at the required level.
 */
export function kycGuard(requiredLevel: number) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    await authGuard(request, _reply);
    if (_reply.sent) return;

    (request as FastifyRequest & { requiredKycLevel?: number }).requiredKycLevel = requiredLevel;
  };
}
