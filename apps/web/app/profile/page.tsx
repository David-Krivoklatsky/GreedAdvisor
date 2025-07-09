'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TokenManager } from '@/lib/token-manager';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [openAiKey, setOpenAiKey] = useState('');
  const [t212Key, setT212Key] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/user/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
      setEmail(data.user.email);
      // Note: API keys are now managed separately
    } catch (err) {
      setError('Failed to load user data');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      setUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateKeys = async (e: React.FormEvent, keyType: 'openai' | 't212') => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/api-keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [keyType === 'openai' ? 'openAiKey' : 't212Key']:
            keyType === 'openai' ? openAiKey : t212Key,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update API key');
      }

      setSuccess(`${keyType === 'openai' ? 'OpenAI' : 'Trading212'} API key updated successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveKey = async (keyType: 'openai' | 't212') => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/api-keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [keyType === 'openai' ? 'openAiKey' : 't212Key']: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove API key');
      }

      if (keyType === 'openai') {
        setOpenAiKey('');
      } else {
        setT212Key('');
      }

      setSuccess(`${keyType === 'openai' ? 'OpenAI' : 'Trading212'} API key removed successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await TokenManager.logout();
    router.push('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                    {success}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full"
                  style={{ backgroundColor: '#1F09FF', color: 'white' }}
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'ai-keys':
        return (
          <Card>
            <CardHeader>
              <CardTitle>AI API Keys</CardTitle>
              <CardDescription>Manage your OpenAI API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => handleUpdateKeys(e, 'openai')} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                    {success}
                  </div>
                )}

                <div>
                  <Label htmlFor="openAiKey">OpenAI API Key</Label>
                  <Input
                    id="openAiKey"
                    type="password"
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    className="mt-1"
                    placeholder="sk-..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1"
                    style={{ backgroundColor: '#1F09FF', color: 'white' }}
                  >
                    {updating ? 'Updating...' : 'Update Key'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveKey('openai')}
                    disabled={updating || !openAiKey}
                    className="flex-1"
                  >
                    Remove Key
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        );
      case 't212-keys':
        return (
          <Card>
            <CardHeader>
              <CardTitle>T212 API Keys</CardTitle>
              <CardDescription>Manage your Trading212 API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => handleUpdateKeys(e, 't212')} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                    {success}
                  </div>
                )}

                <div>
                  <Label htmlFor="t212Key">Trading212 API Key</Label>
                  <Input
                    id="t212Key"
                    type="password"
                    value={t212Key}
                    onChange={(e) => setT212Key(e.target.value)}
                    className="mt-1"
                    placeholder="Enter your Trading212 API key"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1"
                    style={{ backgroundColor: '#1F09FF', color: 'white' }}
                  >
                    {updating ? 'Updating...' : 'Update Key'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveKey('t212')}
                    disabled={updating || !t212Key}
                    className="flex-1"
                  >
                    Remove Key
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-center space-x-3 mb-8">
            <Image
              src="/profile-picture.svg"
              alt="Profile Picture"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.firstName || user?.lastName
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : 'User'}
              </h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeSection === 'profile'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>👤</span>
              <span>Public Profile</span>
            </button>

            <button
              onClick={() => setActiveSection('ai-keys')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeSection === 'ai-keys'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>🔑</span>
              <span>AI API Keys</span>
            </button>

            <button
              onClick={() => setActiveSection('t212-keys')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeSection === 't212-keys'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>🔑</span>
              <span>T212 API Keys</span>
            </button>
          </nav>

          {/* Logout Button */}
          <div className="mt-8 pt-8 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the login page and will need to sign in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-8">{renderContent()}</div>
    </div>
  );
}
