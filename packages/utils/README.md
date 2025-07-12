# @greed-advisor/utils

Shared utility functions for the entire application.

## Functions

### `cn(...inputs)`

Combines CSS classes using `clsx` and `tailwind-merge` for optimal Tailwind CSS merging.

```typescript
import { cn } from '@greed-advisor/utils'

// Basic usage
const className = cn('px-4 py-2', 'bg-blue-500', 'text-white')

// With conditions
const className = cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  isDisabled ? 'opacity-50' : 'hover:bg-blue-600'
)

// In components
<div className={cn('base-classes', className, props.className)} />
```

## Dependencies

- `clsx` - Conditional CSS classes
- `tailwind-merge` - Intelligent Tailwind CSS class merging
