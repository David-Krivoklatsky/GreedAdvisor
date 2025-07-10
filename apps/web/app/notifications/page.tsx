'use client';

import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Notifications</h1>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to GreedAdvisor!</CardTitle>
                <CardDescription>2 hours ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Thank you for joining GreedAdvisor. Start by adding your API keys in the profile
                  section.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Key Added</CardTitle>
                <CardDescription>1 day ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Your OpenAI API key has been successfully added and activated.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
