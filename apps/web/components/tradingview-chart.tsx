'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
  interval?: string;
  theme?: 'light' | 'dark';
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewChart({
  symbol,
  width = '100%',
  height = 400,
  interval = 'D',
  theme = 'light',
  style = '1',
  locale = 'en',
  toolbar_bg = '#f1f3f6',
  enable_publishing = false,
  allow_symbol_change = true,
  container_id = 'tradingview_chart',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: false,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: style,
      locale: locale,
      toolbar_bg: toolbar_bg,
      enable_publishing: enable_publishing,
      allow_symbol_change: allow_symbol_change,
      calendar: false,
      width: width,
      height: height,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [
    symbol,
    width,
    height,
    interval,
    theme,
    style,
    locale,
    toolbar_bg,
    enable_publishing,
    allow_symbol_change,
  ]);

  return (
    <div className="tradingview-widget-container">
      <div ref={containerRef} id={container_id} />
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}
