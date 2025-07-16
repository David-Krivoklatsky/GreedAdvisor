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
  isActive: boolean;
}

export interface AiKey {
  id: number;
  title: string;
  provider: string;
  isActive: boolean;
}

export interface Position {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  size: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'OPEN' | 'WAITING' | 'CLOSED';
  openTime: string;
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
