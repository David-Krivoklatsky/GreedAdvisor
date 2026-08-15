// Type compatibility fixes for Next.js versions across packages
declare module 'next/server' {
  interface NextRequest {
    geo?: any;
    ip?: string;
  }
}

export {};
