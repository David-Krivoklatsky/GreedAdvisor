'use client';

import PageLayout from '@/components/layout/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

const notifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to GreedAdvisor!',
    description:
      'Thank you for joining GreedAdvisor. Start by adding your API keys in the profile section.',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    title: 'API Key Added',
    description: 'Your OpenAI API key has been successfully added and activated.',
    timestamp: '1 day ago',
  },
];

export default function NotificationsPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Notifications</h1>

          <div className="space-y-4">
            {notifications.map(notification => (
              <Card key={notification.id}>
                <CardHeader>
                  <CardTitle>{notification.title}</CardTitle>
                  <CardDescription>{notification.timestamp}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{notification.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
