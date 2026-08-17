'use client';

import React, { useState } from 'react';
import { MarketDataKey } from '../../../types/profile';
import ApiKeyInput from '../../forms/api-key-input';
import KeyCard from '../../key-card';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Combobox } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface MarketDataKeysSectionProps {
  marketDataKeys: MarketDataKey[];
  onAdd: (data: { title: string; provider: string; apiKey: string }) => Promise<void>;
  onToggle: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onTest: (keyData: MarketDataKey) => Promise<void>;
  updating: boolean;
}

export default function MarketDataKeysSection({
  marketDataKeys,
  onAdd,
  onToggle,
  onDelete,
  onTest,
  updating,
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Market Data Keys</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-primary-foreground"
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
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <Label htmlFor="marketDataTitle">Title</Label>
                  <Input
                    id="marketDataTitle"
                    type="text"
                    value={newKey.title}
                    onChange={e => setNewKey({ ...newKey, title: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., My Twelve Data Key"
                    required
                  />
                </div>

                <div>
                  <Label>Provider</Label>
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
                  className="w-full bg-primary text-primary-foreground"
                >
                  {updating ? 'Adding...' : 'Add Market Data Key'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {marketDataKeys.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
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
