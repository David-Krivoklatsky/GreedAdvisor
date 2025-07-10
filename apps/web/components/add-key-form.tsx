import ApiKeyInput from '@/components/ui/api-key-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select';
  value: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface AddKeyFormProps {
  title: string;
  fields: FormField[];
  onFieldChange: (fieldId: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  updating: boolean;
  submitButtonText: string;
}

export default function AddKeyForm({
  title,
  fields,
  onFieldChange,
  onSubmit,
  updating,
  submitButtonText,
}: AddKeyFormProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              {field.type === 'select' ? (
                <div>
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Combobox
                    options={field.options || []}
                    value={field.value}
                    onValueChange={(value) => onFieldChange(field.id, value)}
                    placeholder={field.placeholder || 'Select option...'}
                    className="w-full mt-1"
                  />
                </div>
              ) : field.type === 'password' ? (
                <ApiKeyInput
                  id={field.id}
                  label={field.label}
                  value={field.value}
                  onChange={(value) => onFieldChange(field.id, value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : (
                <>
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    value={field.value}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                    className="mt-1"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                </>
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={updating}
            className="w-full"
            style={{ backgroundColor: '#1F09FF', color: 'white' }}
          >
            {updating ? 'Adding...' : submitButtonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
