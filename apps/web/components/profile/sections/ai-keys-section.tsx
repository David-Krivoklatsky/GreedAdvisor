'use client';

import React, { useState } from 'react';
import { AiApiKey } from '../../../types/profile';
import ApiKeyInput from '../../forms/api-key-input';
import KeyCard from '../../key-card';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Combobox } from '../../ui/combobox';

interface AiKeysSectionProps {
  aiKeys: AiApiKey[];
  onAdd: (data: { title: string; provider: string; apiKey: string }) => Promise<void>;
  onToggle: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  updating: boolean;
  error: string;
  success: string;
}

export default function AiKeysSection({
  aiKeys,
  onAdd,
  onToggle,
  onDelete,
  updating,
  error,
  success,
}: AiKeysSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    title: '',
    provider: 'openai',
    apiKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(newKey);
    setNewKey({ title: '', provider: 'openai', apiKey: '' });
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI API Keys</CardTitle>
        <CardDescription>Manage your AI provider API keys (OpenAI, Claude, etc.)</CardDescription>
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
          <h3 className="text-lg font-semibold">Your AI Keys</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ backgroundColor: '#1F09FF', color: 'white' }}
          >
            {showAddForm ? 'Cancel' : 'Add AI Key'}
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New AI Key</CardTitle>
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
                    placeholder="e.g., My OpenAI Key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <Combobox
                    options={[
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'anthropic', label: 'Anthropic (Claude)' },
                      { value: 'google', label: 'Google (Gemini)' },
                      { value: 'other', label: 'Other' },
                    ]}
                    value={newKey.provider}
                    onValueChange={(value: string) => setNewKey({ ...newKey, provider: value })}
                    placeholder="Select provider..."
                    className="w-full mt-1"
                  />
                </div>

                <ApiKeyInput
                  id="aiApiKey"
                  label="API Key"
                  value={newKey.apiKey}
                  onChange={(value: string) => setNewKey({ ...newKey, apiKey: value })}
                  placeholder="Enter your API key"
                  required
                />

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full"
                  style={{ backgroundColor: '#1F09FF', color: 'white' }}
                >
                  {updating ? 'Adding...' : 'Add AI Key'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {aiKeys.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No AI keys found. Add your first AI key above.
            </p>
          ) : (
            aiKeys.map(key => (
              <KeyCard
                key={key.id}
                keyData={key}
                keyType="ai"
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
