'use client';

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

  const subtitle = `Or <a href="/login" class="font-medium" style="color: #1F09FF">sign in to your existing account</a>`;

  return (
    <AuthLayout title="Create your account" subtitle={subtitle}>
      <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
    </AuthLayout>
  );
}
