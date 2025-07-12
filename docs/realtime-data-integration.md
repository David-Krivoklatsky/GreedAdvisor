# Real-time Market Data Integration Guide

## Overview

This document provides detailed information about integrating real-time market data APIs with the GreedAdvisor dashboard. The implementation includes a TradingView chart component and multiple API options for live data feeds.

## Current Implementation

### TradingView Chart Integration

- **Component**: `components/tradingview-chart.tsx`
- **Features**:
  - Real-time price charts
  - Multiple timeframes
  - Technical indicators
  - Interactive charts
- **Usage**: Embedded directly in the dashboard using TradingView's widget API

## Real-time API Options

### 1. Alpha Vantage

- **Website**: https://www.alphavantage.co/
- **Free Tier**: 5 requests/min, 500 requests/day
- **Real-time Support**: Yes
- **Best For**: Historical data analysis, technical indicators
- **Implementation**:
  ```javascript
  const API_KEY = 'your_alpha_vantage_key';
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
  );
  ```

### 2. Finnhub

- **Website**: https://finnhub.io/
- **Free Tier**: 60 requests/min, WebSocket included
- **Real-time Support**: Yes (WebSocket)
- **Best For**: Real-time streaming, market news
- **Implementation**:
  ```javascript
  const socket = new WebSocket('wss://ws.finnhub.io?token=your_finnhub_token');
  socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    console.log('Price update:', data);
  });
  ```

### 3. IEX Cloud

- **Website**: https://iexcloud.io/
- **Free Tier**: 50,000 core credits/month
- **Real-time Support**: Yes
- **Best For**: US markets, easy integration
- **Implementation**:
  ```javascript
  const API_TOKEN = 'your_iex_token';
  const response = await fetch(
    `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${API_TOKEN}`
  );
  ```

### 4. Polygon.io

- **Website**: https://polygon.io/
- **Free Tier**: 5 requests/min
- **Real-time Support**: Yes (WebSocket)
- **Best For**: Multiple asset classes, options data
- **Implementation**:
  ```javascript
  const socket = new WebSocket('wss://socket.polygon.io/stocks');
  socket.onopen = function () {
    socket.send(JSON.stringify({ action: 'auth', params: 'your_polygon_key' }));
    socket.send(JSON.stringify({ action: 'subscribe', params: 'T.*' }));
  };
  ```

## Implementation Steps

### Step 1: Choose Your API Provider

1. Review the API options in the dashboard
2. Consider your specific needs (free tier limits, real-time requirements)
3. Register for an API key with your chosen provider

### Step 2: Environment Setup

Add your API credentials to environment variables:

```bash
# .env.local
NEXT_PUBLIC_ALPHA_VANTAGE_KEY=your_key_here
NEXT_PUBLIC_FINNHUB_TOKEN=your_token_here
NEXT_PUBLIC_IEX_TOKEN=your_token_here
NEXT_PUBLIC_POLYGON_KEY=your_key_here
```

### Step 3: Update Market Data Fetching

Replace the example API call in `fetchMarketData()` function:

```typescript
const fetchMarketData = async () => {
  try {
    // Example for Alpha Vantage
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${marketData.symbol}&apikey=${process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY}`
    );
    const data = await response.json();
    setMarketData({
      price: data['Global Quote']['05. price'],
      symbol: marketData.symbol,
    });
  } catch (error) {
    console.error('Failed to fetch market data:', error);
  }
};
```

### Step 4: Implement WebSocket for Real-time Updates

For real-time streaming, implement WebSocket connections:

```typescript
useEffect(() => {
  const socket = new WebSocket(
    'wss://ws.finnhub.io?token=' + process.env.NEXT_PUBLIC_FINNHUB_TOKEN
  );

  socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'trade') {
      setMarketData((prev) => ({ ...prev, price: data.data[0].p.toString() }));
    }
  });

  // Subscribe to symbol
  socket.addEventListener('open', function () {
    socket.send(JSON.stringify({ type: 'subscribe', symbol: marketData.symbol }));
  });

  return () => {
    socket.close();
  };
}, [marketData.symbol]);
```

## Rate Limiting and Best Practices

### 1. Implement Rate Limiting

```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter(5, 'minute'); // 5 requests per minute

const makeApiCall = async () => {
  return new Promise((resolve, reject) => {
    limiter.removeTokens(1, async (err, remainingRequests) => {
      if (err) {
        reject(err);
        return;
      }
      // Make your API call here
      resolve(await fetchData());
    });
  });
};
```

### 2. Caching Strategy

```typescript
const cache = new Map();
const CACHE_DURATION = 5000; // 5 seconds

const getCachedData = (symbol: string) => {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};
```

### 3. Error Handling

```typescript
const fetchWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

## Security Considerations

1. **API Key Protection**: Never expose API keys in client-side code
2. **Environment Variables**: Use server-side API calls when possible
3. **Rate Limiting**: Implement client-side rate limiting to avoid API abuse
4. **Data Validation**: Always validate incoming data from APIs

## Performance Optimization

1. **WebSocket over REST**: Use WebSocket for real-time updates to reduce latency
2. **Data Compression**: Enable gzip compression for API responses
3. **Connection Pooling**: Reuse WebSocket connections when possible
4. **Selective Updates**: Only update components when data actually changes

## Monitoring and Analytics

```typescript
// Track API usage
const trackApiCall = (provider: string, endpoint: string, responseTime: number) => {
  console.log(`API Call: ${provider} - ${endpoint} - ${responseTime}ms`);
  // Send to analytics service
};

// Monitor WebSocket connection health
const monitorWebSocket = (socket: WebSocket) => {
  socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
    // Implement reconnection logic
  });

  socket.addEventListener('close', (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
    // Implement reconnection logic
  });
};
```

## Next Steps

1. **Choose and implement your preferred API provider**
2. **Set up environment variables for API keys**
3. **Test the integration with sample data**
4. **Implement error handling and rate limiting**
5. **Monitor performance and optimize as needed**

For more specific implementation details, refer to each API provider's documentation linked in the dashboard's API options modal.
