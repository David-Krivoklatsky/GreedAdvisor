// Type compatibility fixes for Next.js versions
declare module 'next/server' {
  interface NextRequest {
    geo?: any;
    ip?: string;
  }
}

export {};
