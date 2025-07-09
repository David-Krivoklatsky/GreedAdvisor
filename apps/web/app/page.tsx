import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Welcome to <span className="text-primary">Greed Advisor</span>
        </h1>
        <p className="text-lg leading-8 text-gray-600 mb-8">
          Securely manage your API keys for OpenAI and Trading212. Keep your trading and AI
          automation credentials safe and organized.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>🔐 Secure Storage</CardTitle>
              <CardDescription>Your API keys are encrypted and stored securely</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                We use industry-standard encryption to protect your sensitive API credentials.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🚀 Easy Management</CardTitle>
              <CardDescription>Simple dashboard to manage all your keys</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Update your OpenAI and Trading212 API keys with just a few clicks.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
