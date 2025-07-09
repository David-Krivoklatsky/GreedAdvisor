'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  id: number
  email: string
  openAiKey?: string
  t212Key?: string
  createdAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [openAiKey, setOpenAiKey] = useState('')
  const [t212Key, setT212Key] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUser(data.user)
      setOpenAiKey(data.user.openAiKey || '')
      setT212Key(data.user.t212Key || '')
    } catch (err) {
      setError('Failed to load user data')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateKeys = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/user/api-keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          openAiKey: openAiKey || undefined,
          t212Key: t212Key || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update API keys')
      }

      setUser(data.user)
      setSuccess('API keys updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API keys')
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Greed Advisor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              API Key Management
            </h2>
            <p className="text-gray-600 mb-8">
              Securely store and manage your OpenAI and Trading212 API keys.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Update API Keys</CardTitle>
              <CardDescription>
                Enter your API keys below. Leave blank to remove a key.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateKeys} className="space-y-6">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Your OpenAI API key for GPT models
                  </p>
                </div>

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
                  <p className="text-xs text-gray-500 mt-1">
                    Your Trading212 API key for trading operations
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? 'Updating...' : 'Update API Keys'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p><strong>OpenAI Key:</strong> {user?.openAiKey ? '••••••••' : 'Not set'}</p>
                <p><strong>Trading212 Key:</strong> {user?.t212Key ? '••••••••' : 'Not set'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
