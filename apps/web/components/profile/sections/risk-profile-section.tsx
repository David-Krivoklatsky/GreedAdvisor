'use client';

import { useToast } from '@/components/ui/toast';
import { cn } from '@greed-advisor/utils';
import { FormEvent, useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { User } from '../../../types/profile';

interface RiskProfileSectionProps {
  user: User;
  onUpdate: (data: { riskProfile: string }) => Promise<void>;
  updating: boolean;
}

const PROFILES = [
  {
    value: 'conservative',
    label: 'Conservative',
    pct: '1%',
    description:
      'Capital preservation first. Small position sizes, wide stops, less frequent trading.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    pct: '2%',
    description: 'Moderate growth. Medium position sizes with defined risk per trade.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    pct: '3%',
    description: 'Growth oriented. Larger positions, tighter stops, more trading opportunities.',
  },
] as const;

export default function RiskProfileSection({ user, onUpdate, updating }: RiskProfileSectionProps) {
  const [riskProfile, setRiskProfile] = useState(user.riskProfile ?? 'balanced');
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate({ riskProfile });
      toast('Risk profile updated successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update risk profile', 'error');
    }
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PROFILES.map(profile => (
              <button
                key={profile.value}
                type="button"
                onClick={() => setRiskProfile(profile.value)}
                className={cn(
                  'text-left rounded-lg border p-4 transition-all',
                  riskProfile === profile.value
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{profile.label}</span>
                  <span className="text-sm font-bold opacity-70">up to {profile.pct}/trade</span>
                </div>
                <p className="text-xs mt-1 opacity-80">{profile.description}</p>
              </button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={updating || riskProfile === user.riskProfile}
            className="w-full bg-primary text-primary-foreground"
          >
            {updating ? 'Saving...' : 'Save Risk Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
