'use client';

import { useEffect, useRef, useState } from 'react';

interface EnhancedTradingViewChartProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
  interval?: string;
  theme?: 'light' | 'dark';
  onPriceUpdate?: (price: number, symbol: string) => void;
  showPriceOverlay?: boolean;
  autosize?: boolean;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function EnhancedTradingViewChart({
  symbol,
  width = '100%',
  height = '500',
  interval = '15',
  theme = 'light',
  onPriceUpdate,
  showPriceOverlay = true,
  autosize = true,
}: EnhancedTradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);
  const onPriceUpdateRef = useRef(onPriceUpdate);

  // Keep the callback ref updated
  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing widget
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const config = {
      autosize: autosize,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      toolbar_bg: theme === 'light' ? '#f1f3f6' : '#131722',
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      range: '1D',
      studies: ['Volume@tv-basicstudies'],
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      support_host: 'https://www.tradingview.com',
      ...(autosize ? {} : { width, height }),
    };

    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);

    // Set up price monitoring via TradingView's postMessage API
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://s.tradingview.com') return;

      try {
        const data = event.data;
        if (data && data.name === 'tv-widget-ready') {
          // Widget is ready, we can start monitoring prices
          // TradingView widget initialized successfully
        }

        // Listen for price updates
        if (data && data.name === 'quote') {
          const quote = data.data;
          if (quote && quote.price) {
            setCurrentPrice(quote.price);
            setPriceChange(quote.change);
            setPriceChangePercent(quote.change_percent);

            if (onPriceUpdateRef.current) {
              onPriceUpdateRef.current(quote.price, symbol);
            }
          }
        }
      } catch {
        // Error handling TradingView message silently
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, autosize, height, width]); // Only re-render when essential props change

  // Simulate real-time price updates for demo purposes
  // In production, this would come from the TradingView widget or your API
  useEffect(() => {
    if (!showPriceOverlay) return;

    const interval_id = setInterval(() => {
      // Get base prices for different currency pairs
      const basePrices: { [key: string]: number } = {
        'EUR/USD': 1.0875,
        'GBP/USD': 1.2745,
        'USD/JPY': 149.45,
        'AUD/USD': 0.685,
        'USD/CAD': 1.342,
        'NZD/USD': 0.618,
        'USD/CHF': 0.895,
      };

      const basePrice = basePrices[symbol] || 1.0;

      // Create more realistic price movements
      const trendFactor = Math.sin(Date.now() / 10000) * 0.002; // Slow trend component
      const randomFactor = (Math.random() - 0.5) * 0.003; // Random fluctuation
      const fluctuation = trendFactor + randomFactor;

      const newPrice = basePrice + basePrice * fluctuation;
      const change = newPrice - basePrice;
      const changePercent = (change / basePrice) * 100;

      setCurrentPrice(newPrice);
      setPriceChange(change);
      setPriceChangePercent(changePercent);

      if (onPriceUpdateRef.current) {
        onPriceUpdateRef.current(newPrice, symbol);
      }
    }, 1500); // Update every 1.5 seconds for realistic feel

    return () => clearInterval(interval_id);
  }, [symbol, showPriceOverlay]); // Removed onPriceUpdate from dependencies

  const formatPrice = (price: number) => {
    return price.toFixed(5);
  };

  const formatChange = (change: number) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(5)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      {/* TradingView Chart Container */}
      <div className="tradingview-widget-container w-full">
        <div
          ref={containerRef}
          style={{
            height: autosize ? '100%' : height,
            minHeight: '600px',
            width: '100%',
          }}
        />
        <div className="tradingview-widget-copyright text-center py-2">
          <a
            href="https://www.tradingview.com/"
            rel="noopener nofollow"
            target="_blank"
            className="text-blue-600 text-xs hover:underline"
          >
            Powered by TradingView
          </a>
        </div>
      </div>

      {/* Real-time Price Display Below Chart */}
      {showPriceOverlay && currentPrice && (
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold text-gray-800">{symbol}</div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    priceChange && priceChange >= 0 ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}
                ></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Price */}
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-gray-900">{formatPrice(currentPrice)}</div>
              <div className="text-sm text-gray-500">Current Price</div>
            </div>

            {/* Price Change */}
            {priceChange !== null && priceChangePercent !== null && (
              <div
                className={`text-center ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                <div className="text-xl font-bold">{formatChange(priceChange)}</div>
                <div className="text-lg font-semibold">
                  {formatChangePercent(priceChangePercent)}
                </div>
                <div className="text-sm">Change (24h)</div>
              </div>
            )}

            {/* Market Data */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-medium">{formatPrice(currentPrice * 1.002)}</div>
                <div className="text-xs text-gray-500">High</div>
              </div>
              <div>
                <div className="text-sm font-medium">{formatPrice(currentPrice * 0.998)}</div>
                <div className="text-xs text-gray-500">Low</div>
              </div>
              <div>
                <div className="text-sm font-medium">0.00012</div>
                <div className="text-xs text-gray-500">Spread</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
