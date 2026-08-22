'use client';

import { useToast } from '@/components/ui/toast';
import { cn } from '@greed-advisor/utils';
import { FormEvent, useState } from 'react';
import { Button } from '../../ui/button';
import { User } from '../../../types/profile';

interface RiskProfileSectionProps {
  user: User;
  onUpdate: (data: { riskProfile: string }) => Promise<void>;
  updating: boolean;
  stacked?: boolean;
}

const PROFILES = [
  {
    value: 'conservative',
    label: 'Conservative',
    pct: '1%'
  },
  {
    value: 'balanced',
    label: 'Balanced',
    pct: '2%'
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    pct: '3%'
  }
] as const;

export default function RiskProfileSection({
  user,
  onUpdate,
  updating,
  stacked = false
}: RiskProfileSectionProps) {
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

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={cn('grid gap-2', stacked ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3')}>
        {PROFILES.map(profile => (
          <button
            key={profile.value}
            type="button"
            onClick={() => setRiskProfile(profile.value)}
            className={cn(
              'text-left rounded-lg border px-3 py-2.5 transition-all',
              riskProfile === profile.value
                ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            )}
          >
            <div className="flex items-center justify-between gap-x-2">
              <span className="font-semibold text-foreground">{profile.label}</span>
              <span className="text-xs font-bold opacity-70 whitespace-nowrap">
                up to {profile.pct}/trade
              </span>
            </div>
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
  );

  if (stacked) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Risk Profile</h3>
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Risk Profile</h3>
      </div>
      <div className="p-6">{content}</div>
    </div>
  );
}
