import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bot, CandlestickChart, LineChart, ShieldCheck, Star, Zap } from 'lucide-react';
import { ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  content: string;
}

const features: Feature[] = [
  {
    icon: <Bot className="h-5 w-5 text-primary" />,
    title: 'AI Advisor',
    description: 'Opportunity scans with trade plans',
    content:
      'AI analyzes your watchlist and generates ranked opportunities with entry, stop-loss, take-profit, and risk-based position sizing.',
  },
  {
    icon: <CandlestickChart className="h-5 w-5 text-primary" />,
    title: 'Live Charts',
    description: 'Terminal-style candlestick charts',
    content:
      'Follow market movements with interactive candlestick charts and configurable intervals directly on your dashboard.',
  },
  {
    icon: <Star className="h-5 w-5 text-primary" />,
    title: 'Watchlist Alerts',
    description: 'Signal alerts for your tickers',
    content:
      'Build a watchlist and get AI-generated buy, sell, add, and trim signals with confidence scores for each ticker.',
  },
  {
    icon: <Zap className="h-5 w-5 text-primary" />,
    title: 'One-Click Execution',
    description: 'From plan to order in seconds',
    content:
      'Review a pre-filled order, place it on Trading212, and optionally attach stop-loss and take-profit protection orders.',
  },
  {
    icon: <LineChart className="h-5 w-5 text-primary" />,
    title: 'Portfolio Overview',
    description: 'Allocations and live PnL',
    content:
      'Track total value, cash available, unrealized profit/loss, and position allocation across your Trading212 accounts.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    title: 'Risk-Aware Sizing',
    description: 'Conservative, balanced, or aggressive',
    content:
      'Trade plans respect your risk profile, limiting per-trade risk to 1%, 2%, or 3% of your account value.',
  },
];

export default function FeaturesSection() {
  return (
    <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <Card key={index} className="transition-colors hover:border-primary/40">
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {feature.icon}
            </div>
            <CardTitle>{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{feature.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
