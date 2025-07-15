'use client';

import { memo, useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  interval?: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
}

function TradingViewWidget({
  symbol = 'OANDA:XAUUSD',
  width = '100%',
  height = 500,
  interval = '5',
  theme = 'light',
  autosize = true,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing script and content
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }
    container.innerHTML = '';

    // Create a clean widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = autosize ? 'calc(100% - 32px)' : `${height}px`;
    widgetContainer.style.width = '100%';

    // Create copyright section
    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright';
    copyrightDiv.innerHTML = `
      <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
        <span class="blue-text">Track all markets on TradingView</span>
      </a>
    `;

    // Add elements to container
    container.appendChild(widgetContainer);
    container.appendChild(copyrightDiv);

    // Create and configure script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const config = {
      allow_symbol_change: true,
      calendar: false,
      details: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: true,
      interval: interval,
      locale: 'en',
      save_image: true,
      style: '1',
      symbol: symbol,
      theme: theme,
      timezone: 'Etc/UTC',
      backgroundColor: theme === 'light' ? '#ffffff' : '#131722',
      gridColor: theme === 'light' ? 'rgba(46, 46, 46, 0.06)' : 'rgba(240, 243, 250, 0.06)',
      watchlist: [],
      withdateranges: true,
      compareSymbols: [],
      show_popup_button: true,
      popup_height: '650',
      popup_width: '1000',
      studies: ['STD;MACD'],
      autosize: autosize,
      ...(!autosize && { width, height }),
    };

    script.innerHTML = JSON.stringify(config);
    scriptRef.current = script;

    // Append script to widget container instead of document head
    widgetContainer.appendChild(script);

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, autosize, height, width]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        height: autosize ? '100%' : height,
        width: '100%',
        position: 'relative',
      }}
    />
  );
}

export default memo(TradingViewWidget);
