'use client';

import OAuthButtons from '@/components/forms/oauth-buttons';
import RegisterForm from '@/components/forms/register-form';
import AuthLayout from '@/components/layout/auth-layout';
import { TokenManager } from '@/lib/token-manager';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (email: string, password: string, confirmPassword: string) => {
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      TokenManager.setAccessToken(data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const subtitle = (
    <>
      Or{' '}
      <a href="/login" className="font-medium text-primary hover:underline">
        sign in to your existing account
      </a>
    </>
  );

  return (
    <AuthLayout title="Create your account" subtitle={subtitle}>
      <OAuthButtons />
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
    </AuthLayout>
  );
}
