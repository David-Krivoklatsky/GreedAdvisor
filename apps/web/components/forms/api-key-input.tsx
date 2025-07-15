'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ApiKeyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function ApiKeyInput({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter your API key',
  required = false,
  className = '',
}: ApiKeyInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex space-x-2 mt-1">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleVisibility}
          className="h-10 w-10 p-0"
          title={isVisible ? 'Hide API key' : 'Show API key'}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
