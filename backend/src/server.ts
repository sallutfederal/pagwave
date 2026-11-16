import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { ZodError } from "zod";

import { prisma } from "./config/database.js";
import { env } from "./config/env.js";
import { AppError } from "./lib/errors.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { cardRoutes } from "./modules/cards/card.routes.js";
import { gatewayRoutes } from "./modules/gateway/gateway.routes.js";
import { transactionRoutes } from "./modules/transactions/transaction.routes.js";
import { walletRoutes } from "./modules/wallets/wallet.routes.js";

function buildServer() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      // Never write credentials or tokens to the logs.
      redact: ["req.headers.authorization", "req.headers.cookie", "req.body.password", "req.body.refreshToken"],
    },
    trustProxy: env.TRUST_PROXY,
    bodyLimit: 1_048_576,
  });

  /* ------------------------------ Security ------------------------------- */

  void app.register(helmet);

  void app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  void app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  void app.register(jwt, { secret: env.JWT_ACCESS_SECRET });

  /* ------------------------------- Docs ---------------------------------- */

  if (env.NODE_ENV !== "production") {
    void app.register(swagger, {
      openapi: {
        info: {
          title: "Pagwave API",
          description: "Pagwave Financial Infrastructure — REST API",
          version: "1.0.0",
        },
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          },
        },
      },
    });
    void app.register(swaggerUi, { routePrefix: "/docs" });
  }

  /* ----------------------------- Error handler --------------------------- */

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Invalid request data.",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const statusCode = (error as { statusCode?: number }).statusCode;

    // Errors raised by Fastify and its plugins (rate-limit, payload too large, ...).
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({
        error: (error as { code?: string }).code ?? "REQUEST_ERROR",
        message: (error as Error).message,
      });
    }

    // Anything else is a bug: log the details, but never leak them to the client.
    request.log.error({ err: error }, "Unhandled error");
    return reply.status(500).send({
      error: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again later.",
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: "NOT_FOUND",
      message: `Route ${request.method} ${request.url} not found.`,
    });
  });

  /* ------------------------------- Routes -------------------------------- */

  app.get("/health", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", uptime: process.uptime() };
    } catch {
      return reply.status(503).send({ status: "degraded", database: "unreachable" });
    }
  });

  void app.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });
  void app.register(walletRoutes, { prefix: `${env.API_PREFIX}/wallets` });
  void app.register(transactionRoutes, { prefix: `${env.API_PREFIX}/transactions` });
  void app.register(cardRoutes, { prefix: `${env.API_PREFIX}/cards` });
  void app.register(adminRoutes, { prefix: `${env.API_PREFIX}/admin` });
  void app.register(gatewayRoutes, { prefix: `${env.API_PREFIX}/gateway` });

  return app;
}

const app = buildServer();

async function startStandalone() {
  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down...`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  void startStandalone();
}

export default app;
