'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

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
      <div className="relative mt-1">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleVisibility}
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          title={isVisible ? 'Hide API key' : 'Show API key'}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </Button>
      </div>
    </div>
  );
}
