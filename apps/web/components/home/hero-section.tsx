import Link from 'next/link';
import { Button } from '../ui/button';

export default function HeroSection() {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-accent/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-success" />
        AI-powered trading advisor
      </div>
      <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
        Your AI-powered{' '}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Trading Advisor
        </span>
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-muted-foreground">
        GreedAdvisor scans your watchlist with AI, generates risk-aware trade plans, and places
        orders on Trading212 — all from a single terminal-style dashboard.
      </p>

      <div className="mb-16 flex justify-center gap-4">
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
