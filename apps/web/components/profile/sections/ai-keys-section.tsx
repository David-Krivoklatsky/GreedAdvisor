'use client';

import React, { useState } from 'react';
import { AiApiKey } from '../../../types/profile';
import ApiKeyInput from '../../forms/api-key-input';
import KeyCard from '../../key-card';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Combobox } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface AiKeysSectionProps {
  aiKeys: AiApiKey[];
  onAdd: (data: {
    title: string;
    provider: string;
    apiKey: string;
    modelTier?: string;
  }) => Promise<void>;
  onToggle: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  updating: boolean;
}

const MODEL_TIER_OPTIONS = [
  { value: 'all', label: 'All models (free + paid)' },
  { value: 'free', label: 'Free models only' },
  { value: 'paid', label: 'Paid models only' }
];

export default function AiKeysSection({
  aiKeys,
  onAdd,
  onToggle,
  onDelete,
  updating
}: AiKeysSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    title: '',
    provider: 'openai',
    apiKey: '',
    modelTier: 'all'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(newKey);
    setNewKey({ title: '', provider: 'openai', apiKey: '', modelTier: 'all' });
    setShowAddForm(false);
  };

  const showTier = newKey.provider === 'opencode' || newKey.provider === 'openrouter';

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your AI Keys</h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-primary-foreground"
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
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <Label htmlFor="aiTitle">Title</Label>
                  <Input
                    id="aiTitle"
                    type="text"
                    value={newKey.title}
                    onChange={e => setNewKey({ ...newKey, title: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., My OpenAI Key"
                    required
                  />
                </div>

                <div>
                  <Label>Provider</Label>
                  <Combobox
                    options={[
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'anthropic', label: 'Anthropic (Claude)' },
                      { value: 'google', label: 'Google (Gemini)' },
                      { value: 'openrouter', label: 'OpenRouter (auto free models)' },
                      { value: 'opencode', label: 'OpenCode' },
                      { value: 'other', label: 'Other' }
                    ]}
                    value={newKey.provider}
                    onValueChange={(value: string) => setNewKey({ ...newKey, provider: value })}
                    placeholder="Select provider..."
                    className="w-full mt-1"
                  />
                </div>

                {showTier && (
                  <div>
                    <Label>Model tier</Label>
                    <Combobox
                      options={MODEL_TIER_OPTIONS}
                      value={newKey.modelTier}
                      onValueChange={(value: string) => setNewKey({ ...newKey, modelTier: value })}
                      placeholder="Select model tier..."
                      className="w-full mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {newKey.provider === 'openrouter'
                        ? 'Select which OpenRouter models are shown/recommended when you choose this key.'
                        : 'Select which models are shown/recommended for this key.'}
                    </p>
                  </div>
                )}

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
                  className="w-full bg-primary text-primary-foreground"
                >
                  {updating ? 'Adding...' : 'Add AI Key'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {aiKeys.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
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
