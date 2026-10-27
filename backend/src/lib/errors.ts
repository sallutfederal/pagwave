/**
 * Typed application errors with HTTP status codes.
 * Fastify's error handler maps these to JSON responses automatically.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: Record<string, unknown>) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message = "Insufficient funds") {
    super(message, 422, "INSUFFICIENT_FUNDS");
  }
}

export class KycRequiredError extends AppError {
  constructor(requiredLevel: number) {
    super(`KYC level ${requiredLevel} required for this operation`, 403, "KYC_REQUIRED", {
      requiredLevel,
    });
  }
}

export class WithdrawalLimitError extends AppError {
  constructor(limitType: "daily" | "monthly" | "single", limit: string) {
    super(`${limitType} withdrawal limit of ${limit} exceeded`, 422, "WITHDRAWAL_LIMIT_EXCEEDED", {
      limitType,
      limit,
    });
  }
}
