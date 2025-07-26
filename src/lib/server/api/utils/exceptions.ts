import type { AuthGuardedApp } from '$server/api/api';

import { StatusCodes } from '$lib/utils/status-codes';
import { Logger } from '$server/api/logger';
import { inject, injectable } from '@needle-di/core';
import { type Static, t } from 'elysia';

export type ErrorSchema<T extends string, C extends number> = Static<
  ReturnType<typeof errorSchema<T, C>>
>;

export class HttpError extends Error {
  public constructor(
    public message: string,
    public statusCode: number,
    public errorData: unknown = undefined
  ) {
    super(message);
  }
}

export function BadGateway(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Bad Gateway', StatusCodes.BAD_GATEWAY, errorData);
}

export function BadRequest(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Bad Request', StatusCodes.BAD_REQUEST, errorData);
}

export function Conflict(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Conflict', StatusCodes.CONFLICT, errorData);
}

export function errorSchema<T extends string, C extends number>(data: T, code: C) {
  return t.Object({
    code: t.Literal(code),
    data: t.Literal(data),
    message: t.Optional(t.String())
  });
}

export function failShouldNotHappen() {
  return Internal();
}

export function Forbidden(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Forbidden', StatusCodes.FORBIDDEN, errorData);
}

export function GatewayTimeout(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Gateway Timeout', StatusCodes.GATEWAY_TIMEOUT, errorData);
}

export function IAmATeapot(message?: string, errorData?: unknown) {
  return new HttpError(message || 'IAmATeapot', StatusCodes.IM_A_TEAPOT, errorData);
}

export function Internal(message?: string, errorData?: unknown) {
  return new HttpError(
    message || 'Internal Server Error',
    StatusCodes.INTERNAL_SERVER_ERROR,
    errorData
  );
}

export function MethodNotAllowed(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Method Not Allowed', StatusCodes.METHOD_NOT_ALLOWED, errorData);
}

export function NotFound(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Not Found', StatusCodes.NOT_FOUND, errorData);
}

export function NotImplemented(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Not Implemented', StatusCodes.NOT_IMPLEMENTED, errorData);
}

export function PaymentRequired(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Payment Required', StatusCodes.PAYMENT_REQUIRED, errorData);
}

export function ServiceUnavailable(message?: string, errorData?: unknown) {
  return new HttpError(
    message || 'Service Unavailable',
    StatusCodes.SERVICE_UNAVAILABLE,
    errorData
  );
}
export function TooManyRequests(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Too Many Requests', StatusCodes.TOO_MANY_REQUESTS, errorData);
}

export function Unauthorized(message?: string, errorData?: unknown) {
  return new HttpError(message || 'Unauthorized', StatusCodes.UNAUTHORIZED, errorData);
}

export function UnsupportedMediaType(message?: string, errorData?: unknown) {
  return new HttpError(
    message || 'UnsupportedMediaType',
    StatusCodes.UNSUPPORTED_MEDIA_TYPE,
    errorData
  );
}

@injectable()
export class HttpErrorHandler {
  constructor(private readonly logger = inject(Logger)) {
    this.handleError = this.handleError.bind(this);
  }

  handleError(app: AuthGuardedApp) {
    const logger = this.logger;

    return app
      .error({
        ELYSIA_HTTP_ERROR: HttpError
      })
      .onError({ as: 'global' }, function onError({ code, error, set }): ErrorSchema<
        'ELYSIA_HTTP_ERROR' | 'INTERNAL_SERVER_ERROR',
        number
      > {
        if (code === 'ELYSIA_HTTP_ERROR') {
          set.status = error.statusCode;
          logger.withMetadata(error).error(error.message);
          return {
            code: error.statusCode,
            data: 'ELYSIA_HTTP_ERROR',
            message: error.message
          };
        } else {
          logger.withMetadata(error).error('Unhandled error');
          return {
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            data: 'INTERNAL_SERVER_ERROR',
            message: 'Internal Server Error'
          };
        }
      });
  }
}
