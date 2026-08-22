export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  riskProfile?: 'conservative' | 'balanced' | 'aggressive';
  createdAt: string;
}

export interface AiApiKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  apiKey: string;
}

export interface TradingApiKey {
  id: number;
  title: string;
  accessType: string;
  environment: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  apiKey: string;
  provider?: string;
}

export interface MarketDataKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  apiKey: string;
}
