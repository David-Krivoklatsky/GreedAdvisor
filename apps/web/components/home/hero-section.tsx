import Link from 'next/link';
import { Button } from '../ui/button';

export default function HeroSection() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
        Welcome to <span className="text-primary">Greed Advisor</span>
      </h1>
      <p className="text-lg leading-8 text-gray-600 mb-8">
        Securely manage your API keys for OpenAI and Trading212. Keep your trading and AI automation
        credentials safe and organized.
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
    </div>
  );
}
