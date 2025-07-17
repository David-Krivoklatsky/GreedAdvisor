// Type compatibility fixes for Next.js versions
declare module 'next/server' {
  interface NextRequest {
    [INTERNALS]?: any;
    geo?: any;
    ip?: string;
  }
}

export {};
