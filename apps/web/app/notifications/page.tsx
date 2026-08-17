'use client';

import PageLayout from '@/components/layout/page-layout';
import { Bell, KeyRound, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

interface Notification {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  timestamp: string;
}

const notifications: Notification[] = [
  {
    id: '1',
    icon: <Sparkles className="h-4 w-4 text-primary" />,
    title: 'Welcome to GreedAdvisor!',
    description:
      'Thank you for joining GreedAdvisor. Start by adding your API keys in the profile section.',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    icon: <KeyRound className="h-4 w-4 text-success" />,
    title: 'API Key Added',
    description: 'Your OpenAI API key has been successfully added and activated.',
    timestamp: '1 day ago',
  },
];

export default function NotificationsPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {notifications.length} notification{notifications.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                  {notification.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium">{notification.title}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {notification.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
