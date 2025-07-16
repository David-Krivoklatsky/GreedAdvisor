'use client';

import { useState } from 'react';
import { TradingApiKey } from '../../../types/profile';
import ApiKeyInput from '../../forms/api-key-input';
import KeyCard from '../../key-card';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Combobox } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface TradingKeysSectionProps {
  tradingKeys: TradingApiKey[];
  onAdd: (data: { title: string; accessType: string; apiKey: string }) => Promise<void>;
  onToggle: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  updating: boolean;
  error: string;
  success: string;
}

export default function TradingKeysSection({
  tradingKeys,
  onAdd,
  onToggle,
  onDelete,
  updating,
  error,
  success,
}: TradingKeysSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    title: '',
    accessType: 'read-only',
    apiKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(newKey);
    setNewKey({ title: '', accessType: 'read-only', apiKey: '' });
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading API Keys</CardTitle>
        <CardDescription>Manage your Trading212 API keys</CardDescription>
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
          <h3 className="text-lg font-semibold">Your Trading Keys</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ backgroundColor: '#1F09FF', color: 'white' }}
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="tradingTitle">Title</Label>
                  <Input
                    id="tradingTitle"
                    type="text"
                    value={newKey.title}
                    onChange={e => setNewKey({ ...newKey, title: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., My Trading212 Key"
                    required
                  />
                </div>

                <div>
                  <Label>Access Type</Label>
                  <Combobox
                    options={[
                      { value: 'read-only', label: 'Read Only' },
                      { value: 'full-access', label: 'Full Access' },
                    ]}
                    value={newKey.accessType}
                    onValueChange={(value: string) => setNewKey({ ...newKey, accessType: value })}
                    placeholder="Select option..."
                    className="w-full mt-1"
                  />
                </div>

                <ApiKeyInput
                  id="tradingApiKey"
                  label="API Key"
                  value={newKey.apiKey}
                  onChange={(value: string) => setNewKey({ ...newKey, apiKey: value })}
                  placeholder="Enter your Trading212 API key"
                  required
                />

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full"
                  style={{ backgroundColor: '#1F09FF', color: 'white' }}
                >
                  {updating ? 'Adding...' : 'Add Trading Key'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tradingKeys.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
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
