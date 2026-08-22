import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

/**
 * Shared context passed through middleware wrappers to route handlers.
 * - `userId` is populated by `withAuth`
 * - `data` is populated by `withValidation`
 * - `params` is passed through from Next.js route handlers
 */
export interface RequestContext {
  userId?: number;
  data?: unknown;
  params?: Record<string, string> | Promise<Record<string, string>>;
}

export type RouteHandler = (req: NextRequest, ctx: RequestContext) => Promise<NextResponse>;

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
}

const unauthorizedResponse = (): NextResponse =>
  NextResponse.json(
    {
      success: false,
      message: 'Unauthorized',
      error: 'Missing or invalid authorization header',
      statusCode: 401
    } satisfies ApiErrorResponse,
    { status: 401 }
  );

const invalidTokenResponse = (): NextResponse =>
  NextResponse.json(
    {
      success: false,
      message: 'Unauthorized',
      error: 'Invalid or expired token',
      statusCode: 401
    } satisfies ApiErrorResponse,
    { status: 401 }
  );

const validationErrorResponse = (error: ZodError): NextResponse =>
  NextResponse.json(
    {
      success: false,
      message: 'Validation failed',
      error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      statusCode: 400
    } satisfies ApiErrorResponse,
    { status: 400 }
  );

const internalErrorResponse = (): NextResponse =>
  NextResponse.json(
    {
      success: false,
      message: 'Internal server error',
      error: 'An unexpected error occurred',
      statusCode: 500
    } satisfies ApiErrorResponse,
    { status: 500 }
  );

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/** Catches any thrown error and returns a consistent error envelope. */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }
      return internalErrorResponse();
    }
  };
}

/** Applies security headers to every response (including error responses). */
export function withSecurityHeaders(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const response = await handler(req, ctx);
    addSecurityHeaders(response);
    return response;
  };
}

/** Parses and validates the request body (non-GET) or search params (GET). */
export function withValidation<T>(schema: ZodSchema<T>) {
  return (
    handler: (req: NextRequest, ctx: RequestContext & { data?: T }) => Promise<NextResponse>
  ): RouteHandler => {
    return async (req, ctx = {}) => {
      try {
        const source =
          req.method === 'GET' ? Object.fromEntries(req.nextUrl.searchParams) : await req.json();
        const data = schema.parse(source);
        return await handler(req, { ...ctx, data });
      } catch (error) {
        if (error instanceof ZodError) {
          return validationErrorResponse(error);
        }
        throw error;
      }
    };
  };
}

/** Requires a valid Bearer access token and provides `ctx.userId`. */
export function withAuth(
  handler: (req: NextRequest, ctx: RequestContext & { userId: number }) => Promise<NextResponse>
): RouteHandler {
  return async (req, ctx = {}) => {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return unauthorizedResponse();
    }

    const decoded = verifyAccessToken(token);
    if (!decoded?.userId) {
      return invalidTokenResponse();
    }

    return handler(req, { ...ctx, userId: decoded.userId });
  };
}

/**
 * Standard wrapper for API routes:
 * error handling + security headers on every response.
 */
export const withApiMiddleware = (handler: RouteHandler): RouteHandler => {
  return async (req, ctx) => {
    let response: NextResponse;
    try {
      response = await handler(req, ctx);
    } catch (error) {
      response =
        error instanceof ZodError ? validationErrorResponse(error) : internalErrorResponse();
    }
    addSecurityHeaders(response);
    return response;
  };
};
