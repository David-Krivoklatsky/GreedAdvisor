'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  openAiKey?: string;
  t212Key?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [openAiKey, setOpenAiKey] = useState('');
  const [t212Key, setT212Key] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [marketData, setMarketData] = useState({ price: '', symbol: 'USD/AUX' });
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchMarketData();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
      setOpenAiKey(data.user.openAiKey || '');
      setT212Key(data.user.t212Key || '');
    } catch (err) {
      setError('Failed to load user data');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch('https://api.example.com/market-data?symbol=USD/AUX');
      const data = await response.json();
      setMarketData({ price: data.price, symbol: 'USD/AUX' });
    } catch (err) {
      console.error('Failed to fetch market data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Image src="/greedadvisor.png" alt="GreedAdvisor Logo" width={220} height={220} />
            </div>
            <div className="flex items-center space-x-4">
              <Image
                src="/profile-picture.svg"
                alt="Profile Picture"
                width={40}
                height={40}
                className="rounded-full cursor-pointer"
                onClick={() => router.push('/profile')}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-3 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Market Graph</CardTitle>
              <CardDescription>Select a symbol to view market data</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                onChange={(e) => setMarketData({ ...marketData, symbol: e.target.value })}
              >
                <option value="USD/AUX">USD/AUX</option>
                <option value="EUR/USD">EUR/USD</option>
              </select>
              <div className="mt-4 text-lg font-bold" style={{ color: '#1F09FF' }}>
                Price: {marketData.price || 'Loading...'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Select options and generate a report</CardDescription>
            </CardHeader>
            <CardContent>
              <select className="w-full border border-gray-300 rounded px-3 py-2">
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
              </select>
              <Button
                className="w-full mt-4"
                style={{ backgroundColor: '#1F09FF', color: 'white' }}
              >
                Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
