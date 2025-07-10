'use client';

import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ApiKeyDisplayProps {
  apiKey: string;
  className?: string;
  placeholder?: string;
}

export default function ApiKeyDisplay({
  apiKey,
  className = '',
  placeholder = '••••••••••••••••••••••••••••••••',
}: ApiKeyDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border flex-1">
        {isVisible ? apiKey : placeholder}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleVisibility}
        className="h-8 w-8 p-0"
        title={isVisible ? 'Hide API key' : 'Show API key'}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
