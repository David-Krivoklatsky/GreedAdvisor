'use client';

import React, { useState } from 'react';
import { TradingApiKey } from '../../../types/profile';
import ApiKeyInput from '../../forms/api-key-input';
import KeyCard from '../../key-card';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Combobox } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface TradingKeysSectionProps {
  tradingKeys: TradingApiKey[];
  onAdd: (data: {
    title: string;
    provider: string;
    accessType: string;
    environment: string;
    apiKey: string;
    apiSecret: string;
  }) => Promise<void>;
  onToggle: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  updating: boolean;
}

const PROVIDER_OPTIONS = [
  { value: 'trading212', label: 'Trading212' },
  { value: 'alpaca', label: 'Alpaca' }
];

const PROVIDER_ENV: Record<string, { value: string; label: string }[]> = {
  trading212: [
    { value: 'demo', label: 'Demo (Paper Trading)' },
    { value: 'live', label: 'Live' }
  ],
  alpaca: [
    { value: 'paper', label: 'Paper' },
    { value: 'live', label: 'Live' }
  ]
};

export default function TradingKeysSection({
  tradingKeys,
  onAdd,
  onToggle,
  onDelete,
  updating
}: TradingKeysSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    title: '',
    provider: 'trading212',
    accessType: 'read-only',
    environment: 'demo',
    apiKey: '',
    apiSecret: ''
  });

  const provider = newKey.provider;
  const isAlpaca = provider === 'alpaca';

  const handleProviderChange = (value: string) => {
    setNewKey({
      ...newKey,
      provider: value,
      environment: value === 'alpaca' ? 'paper' : 'demo',
      accessType: value === 'alpaca' ? 'read-only' : newKey.accessType
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(newKey);
    setNewKey({
      title: '',
      provider: 'trading212',
      accessType: 'read-only',
      environment: 'demo',
      apiKey: '',
      apiSecret: ''
    });
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Trading Keys</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-primary-foreground"
          >
            {showAddForm ? 'Cancel' : 'Add Trading Key'}
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Trading Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <Label htmlFor="tradingTitle">Title</Label>
                  <Input
                    id="tradingTitle"
                    type="text"
                    value={newKey.title}
                    onChange={e => setNewKey({ ...newKey, title: e.target.value })}
                    className="mt-1"
                    placeholder={`e.g., My ${isAlpaca ? 'Alpaca' : 'Trading212'} Key`}
                    required
                  />
                </div>

                <div>
                  <Label>Provider</Label>
                  <Combobox
                    options={PROVIDER_OPTIONS}
                    value={newKey.provider}
                    onValueChange={handleProviderChange}
                    placeholder="Select provider..."
                    className="w-full mt-1"
                  />
                </div>

                {!isAlpaca && (
                  <div>
                    <Label>Access Type</Label>
                    <Combobox
                      options={[
                        { value: 'read-only', label: 'Read Only' },
                        { value: 'full-access', label: 'Full Access' }
                      ]}
                      value={newKey.accessType}
                      onValueChange={(value: string) => setNewKey({ ...newKey, accessType: value })}
                      placeholder="Select option..."
                      className="w-full mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label>Environment</Label>
                  <Combobox
                    options={PROVIDER_ENV[provider] ?? PROVIDER_ENV.trading212}
                    value={newKey.environment}
                    onValueChange={(value: string) => setNewKey({ ...newKey, environment: value })}
                    placeholder="Select environment..."
                    className="w-full mt-1"
                  />
                </div>

                <ApiKeyInput
                  id="tradingApiKey"
                  label={isAlpaca ? 'API Key ID' : 'API Key'}
                  value={newKey.apiKey}
                  onChange={(value: string) => setNewKey({ ...newKey, apiKey: value })}
                  placeholder={
                    isAlpaca ? 'Enter your Alpaca API key ID' : 'Enter your Trading212 API key'
                  }
                  required
                />

                <ApiKeyInput
                  id="tradingApiSecret"
                  label={isAlpaca ? 'API Secret Key' : 'API Secret'}
                  value={newKey.apiSecret}
                  onChange={(value: string) => setNewKey({ ...newKey, apiSecret: value })}
                  placeholder={
                    isAlpaca
                      ? 'Enter your Alpaca API secret key'
                      : 'Enter your Trading212 API secret'
                  }
                  required
                />

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-primary text-primary-foreground"
                >
                  {updating ? 'Adding...' : 'Add Trading Key'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tradingKeys.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No trading keys found. Add your first trading key above.
            </p>
          ) : (
            tradingKeys.map(key => (
              <KeyCard
                key={key.id}
                keyData={key}
                keyType="trading"
                onToggle={onToggle}
                onDelete={onDelete}
                updating={updating}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
