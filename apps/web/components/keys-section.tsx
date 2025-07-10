import AddKeyForm from '@/components/add-key-form';
import ErrorSuccessAlert from '@/components/error-success-alert';
import KeyCard from '@/components/key-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BaseKey {
  id: number;
  title: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

interface AiKey extends BaseKey {
  provider: string;
}

interface TradingKey extends BaseKey {
  accessType: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select';
  value: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface KeysSectionProps {
  title: string;
  description: string;
  keys: AiKey[] | TradingKey[];
  keyType: 'ai' | 'trading';
  showAddKey: boolean;
  onToggleAddKey: () => void;
  addFormTitle: string;
  addFormFields: FormField[];
  onFieldChange: (fieldId: string, value: string) => void;
  onAddKey: (e: React.FormEvent) => void;
  onToggleKey: (keyId: number, isActive: boolean) => void;
  onDeleteKey: (keyId: number) => void;
  updating: boolean;
  error?: string;
  success?: string;
  emptyMessage: string;
  addButtonText: string;
}

export default function KeysSection({
  title,
  description,
  keys,
  keyType,
  showAddKey,
  onToggleAddKey,
  addFormTitle,
  addFormFields,
  onFieldChange,
  onAddKey,
  onToggleKey,
  onDeleteKey,
  updating,
  error,
  success,
  emptyMessage,
  addButtonText,
}: KeysSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorSuccessAlert error={error} success={success} />

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Your {keyType === 'ai' ? 'AI' : 'Trading'} Keys
            </h3>
            <Button onClick={onToggleAddKey} style={{ backgroundColor: '#1F09FF', color: 'white' }}>
              {showAddKey ? 'Cancel' : addButtonText}
            </Button>
          </div>

          {showAddKey && (
            <AddKeyForm
              title={addFormTitle}
              fields={addFormFields}
              onFieldChange={onFieldChange}
              onSubmit={onAddKey}
              updating={updating}
              submitButtonText={`Add ${keyType === 'ai' ? 'AI' : 'Trading'} Key`}
            />
          )}

          <div className="space-y-4">
            {keys.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
            ) : (
              keys.map((key) => (
                <KeyCard
                  key={key.id}
                  keyData={key as AiKey | TradingKey}
                  keyType={keyType}
                  onToggle={onToggleKey}
                  onDelete={onDeleteKey}
                  updating={updating}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
