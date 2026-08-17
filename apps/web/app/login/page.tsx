'use client';

import OAuthButtons from '@/components/forms/oauth-buttons';
import LoginForm from '@/components/forms/login-form';
import AuthLayout from '@/components/layout/auth-layout';
import { useToast } from '@/components/ui/toast';
import { TokenManager } from '@/lib/token-manager';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      const messages: Record<string, string> = {
        oauth_not_configured: 'OAuth sign-in is not configured yet.',
        state_mismatch: 'Sign-in could not be verified. Please try again.',
        missing_code: 'Sign-in was cancelled. Please try again.',
        oauth_failed: 'Sign-in failed. Please try again.',
        unsupported_provider: 'This sign-in method is not supported.',
      };
      toast(messages[oauthError] ?? 'Sign-in failed. Please try again.', 'error');
      router.replace('/login');
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      TokenManager.setAccessToken(data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const subtitle = (
    <>
      Or{' '}
      <a href="/register" className="font-medium text-primary hover:underline">
        create a new account
      </a>
    </>
  );

  return (
    <AuthLayout title="Sign in to your account" subtitle={subtitle}>
      <OAuthButtons />
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
    </AuthLayout>
  );
}
