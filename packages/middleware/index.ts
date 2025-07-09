import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import type { ApiResponse, ApiError } from '@greed-advisor/types';

// Error handling middleware
export function withErrorHandler<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T> | ApiError>> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ZodError) {
        return NextResponse.json({
          success: false,
          message: 'Validation failed',
          error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          statusCode: 400,
        } as ApiError, { status: 400 });
      }

      if (error instanceof Error) {
        return NextResponse.json({
          success: false,
          message: 'Internal server error',
          error: error.message,
          statusCode: 500,
        } as ApiError, { status: 500 });
      }

      return NextResponse.json({
        success: false,
        message: 'Unknown error occurred',
        error: 'An unexpected error occurred',
        statusCode: 500,
      } as ApiError, { status: 500 });
    }
  };
}

// Request validation middleware
export function withValidation<T>(schema: ZodSchema<T>) {
  return function (
    handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        let data: any;

        if (req.method === 'GET') {
          // For GET requests, validate search params
          const searchParams = Object.fromEntries(req.nextUrl.searchParams);
          data = schema.parse(searchParams);
        } else {
          // For other methods, validate JSON body
          const body = await req.json();
          data = schema.parse(body);
        }

        return await handler(req, data);
      } catch (error) {
        if (error instanceof ZodError) {
          return NextResponse.json({
            success: false,
            message: 'Validation failed',
            error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
            statusCode: 400,
          } as ApiError, { status: 400 });
        }

        throw error; // Re-throw non-validation errors
      }
    };
  };
}

// CORS middleware
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(req);

    // Add CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  };
}

// Security headers middleware
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );

    return response;
  };
}

// Rate limiting check (to be used with rate-limit package)
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // This would integrate with your rate-limit package
    // For now, just pass through
    return await handler(req);
  };
}

// Authentication middleware
export function withAuth(
  handler: (req: NextRequest, userId: number) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        error: 'Missing or invalid authorization header',
        statusCode: 401,
      } as ApiError, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      // Here you would verify the JWT token
      // This is a placeholder - you'd use your auth package
      const userId = 1; // Replace with actual token verification
      
      return await handler(req, userId);
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        error: 'Invalid token',
        statusCode: 401,
      } as ApiError, { status: 401 });
    }
  };
}

// Compose multiple middleware
export function compose<T extends any[]>(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: (...args: T) => Promise<NextResponse>) => {
    return middlewares.reduce(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

// Common middleware composition for API routes
export const withApiMiddleware = compose(
  withErrorHandler,
  withSecurityHeaders,
  withCors,
  withRateLimit
);

export const withAuthenticatedApi = compose(
  withErrorHandler,
  withSecurityHeaders,
  withCors,
  withRateLimit,
  withAuth
);
