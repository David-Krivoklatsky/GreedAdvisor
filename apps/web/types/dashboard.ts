export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface TradingKey {
  id: number;
  title: string;
  accessType: string;
  environment: string;
  isActive: boolean;
}

export interface AiKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
}

export interface MarketDataKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
}

export interface Position {
  id: number;
  ticker: string;
  quantity: number;
  currentPrice: number;
  averagePrice: number;
  ppl: number;
  pplCurrency: string;
  initialValue: number;
  currentValue: number;
  fxPpl: number;
}

export interface CashAccount {
  currencyCode: string;
  balance: number;
  cash: number;
  blocked: number;
  investableCash: number;
  ppl: number;
  reserved: number;
  result: number;
  total: number;
}

export interface MarketData {
  price: string;
  symbol: string;
}

export interface NotificationData {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ComboboxOption {
  value: string;
  label: string;
}
