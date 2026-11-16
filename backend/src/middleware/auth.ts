import type { FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches `request.user` with { id, email, role } on success.
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

    // Attach user to request for downstream handlers
    request.user = payload;
  } catch (err) {
    reply.status(401).send({
      error: "Unauthorized",
      message: "Invalid or expired access token.",
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
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await authGuard(request, reply);
    if (reply.sent) return;

    const user = request.user as { id: string };
    // KYC level is checked at the service layer for actual enforcement
    // This middleware sets the requirement on the request context
    (request as FastifyRequest & { requiredKycLevel?: number }).requiredKycLevel = requiredLevel;
  };
}
