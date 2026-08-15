'use client';

import React, { useState } from 'react';
import { MarketDataKey } from '../../../types/profile';
import ApiKeyInput from '../../forms/api-key-input';
import KeyCard from '../../key-card';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Combobox } from '../../ui/combobox';

interface MarketDataKeysSectionProps {
  marketDataKeys: MarketDataKey[];
  onAdd: (data: { title: string; provider: string; apiKey: string }) => Promise<void>;
  onToggle: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onTest: (keyData: MarketDataKey) => Promise<void>;
  updating: boolean;
  error: string;
  success: string;
}

export default function MarketDataKeysSection({
  marketDataKeys,
  onAdd,
  onToggle,
  onDelete,
  onTest,
  updating,
  error,
  success,
}: MarketDataKeysSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    title: '',
    provider: 'twelvedata',
    apiKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(newKey);
    setNewKey({ title: '', provider: 'twelvedata', apiKey: '' });
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Data API Keys</CardTitle>
        <CardDescription>
          Manage your market data API keys (Twelve Data) for real-time quotes and candles
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Market Data Keys</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ backgroundColor: '#1F09FF', color: 'white' }}
          >
            {showAddForm ? 'Cancel' : 'Add Market Data Key'}
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Market Data Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newKey.title}
                    onChange={e => setNewKey({ ...newKey, title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., My Twelve Data Key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <Combobox
                    options={[{ value: 'twelvedata', label: 'Twelve Data' }]}
                    value={newKey.provider}
                    onValueChange={(value: string) => setNewKey({ ...newKey, provider: value })}
                    placeholder="Select provider..."
                    className="w-full mt-1"
                  />
                </div>

                <ApiKeyInput
                  id="marketDataApiKey"
                  label="API Key"
                  value={newKey.apiKey}
                  onChange={(value: string) => setNewKey({ ...newKey, apiKey: value })}
                  placeholder="Enter your market data API key"
                  required
                />

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full"
                  style={{ backgroundColor: '#1F09FF', color: 'white' }}
                >
                  {updating ? 'Adding...' : 'Add Market Data Key'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {marketDataKeys.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No market data keys found. Add your first key above.
            </p>
          ) : (
            marketDataKeys.map(key => (
              <KeyCard
                key={key.id}
                keyData={key}
                keyType="marketdata"
                onToggle={onToggle}
                onDelete={onDelete}
                onTest={onTest}
                updating={updating}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
