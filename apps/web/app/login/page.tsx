'use client';

import LoginForm from '@/components/forms/login-form';
import AuthLayout from '@/components/layout/auth-layout';
import { TokenManager } from '@/lib/token-manager';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

  const subtitle = `Or <a href="/register" class="font-medium" style="color: #1F09FF">create a new account</a>`;

  return (
    <AuthLayout title="Sign in to your account" subtitle={subtitle}>
      <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
    </AuthLayout>
  );
}
