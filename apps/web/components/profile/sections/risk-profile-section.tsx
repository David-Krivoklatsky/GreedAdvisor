'use client';

import { FormEvent, useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { User } from '../../../types/profile';

interface RiskProfileSectionProps {
  user: User;
  onUpdate: (data: { riskProfile: string }) => Promise<void>;
  updating: boolean;
  error: string;
  success: string;
}

const PROFILES = [
  {
    value: 'conservative',
    label: 'Conservative',
    pct: '1%',
    description:
      'Capital preservation first. Small position sizes, wide stops, less frequent trading.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    pct: '2%',
    description: 'Moderate growth. Medium position sizes with defined risk per trade.',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    pct: '3%',
    description: 'Growth oriented. Larger positions, tighter stops, more trading opportunities.',
    color: 'bg-red-50 border-red-200 text-red-800',
  },
] as const;

export default function RiskProfileSection({
  user,
  onUpdate,
  updating,
  error,
  success,
}: RiskProfileSectionProps) {
  const [riskProfile, setRiskProfile] = useState(user.riskProfile ?? 'balanced');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onUpdate({ riskProfile });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Profile</CardTitle>
        <CardDescription>
          Sets how the AI sizes positions in your trade plans. You always keep final control and can
          override any suggested size.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PROFILES.map(profile => (
              <button
                key={profile.value}
                type="button"
                onClick={() => setRiskProfile(profile.value)}
                className={`text-left rounded-lg border p-4 transition-all ${
                  riskProfile === profile.value
                    ? `${profile.color} ring-2 ring-indigo-500 ring-offset-1`
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{profile.label}</span>
                  <span className="text-sm font-bold opacity-70">up to {profile.pct}/trade</span>
                </div>
                <p className="text-xs mt-1 opacity-80">{profile.description}</p>
              </button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={updating || riskProfile === user.riskProfile}
            className="w-full"
            style={{ backgroundColor: '#1F09FF', color: 'white' }}
          >
            {updating ? 'Saving...' : 'Save Risk Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
