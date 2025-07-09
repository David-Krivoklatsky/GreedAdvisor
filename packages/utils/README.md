# @greed-advisor/utils

Zdieľané utility funkcie pre celú aplikáciu.

## Funkcie

### `cn(...inputs)`

Kombinuje CSS triedy pomocou `clsx` a `tailwind-merge` pre optimálne Tailwind CSS zlúčenie.

```typescript
import { cn } from '@greed-advisor/utils'

// Základné použitie
const className = cn('px-4 py-2', 'bg-blue-500', 'text-white')

// S podmienkami
const className = cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  isDisabled ? 'opacity-50' : 'hover:bg-blue-600'
)

// V komponentoch
<div className={cn('base-classes', className, props.className)} />
```

## Závislosti

- `clsx` - Podmienené CSS triedy
- `tailwind-merge` - Inteligentné zlúčenie Tailwind CSS tried
