'use client';

import { useWebSocketPrice } from '@/lib/useWebSocket';
import { usePriceStore } from '@/lib/store';
import { useEffect } from 'react';

export function PriceTicker() {
  const { price, connected } = useWebSocketPrice();
  const { setPriceData } = usePriceStore();

  useEffect(() => {
    if (price !== null) {
      setPriceData({
        tao_price: price,
        market_cap: 0,
        volume_24h: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }, [price, setPriceData]);

  const displayPrice = price ?? 0;
  const priceString = displayPrice.toFixed(2);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          }`}
          title={connected ? 'Live data' : 'Connecting...'}
        />
        <span className="text-sm font-medium text-gray-400">TAO Price:</span>
        <span className="text-lg font-bold text-white">${priceString}</span>
      </div>
    </div>
  );
}
