# Component Guidelines

## Structure

```
components/
├── ui/           # shadcn/ui primitives
├── forms/        # Form components
├── layout/       # Headers, sidebars, etc.
└── feature/      # Feature-specific (dashboard/, etc.)
```

## Component Template

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "secondary"
  size?: "sm" | "md" | "lg"
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <element
      ref={ref}
      className={cn("base", variant === "secondary" && "variant", size === "sm" && "small", className)}
      {...props}
    />
  )
)
Component.displayName = "Component"

export { Component }
export type { ComponentProps }
```

## Conventions

- **Files**: kebab-case (`my-component.tsx`)
- **Components**: PascalCase (`MyComponent`)
- **Props**: camelCase, extend HTML attributes
- **Styling**: Tailwind utilities via `cn()`

## Best Practices

1. **Composition over inheritance** — `<Button><Icon />Label</Button>` not `<IconButton />`
2. **Extend HTML props** — `interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement>`
3. **Accessibility** — semantic HTML, ARIA, keyboard nav, focus management
4. **Performance** — `React.memo` for expensive renders, `useCallback` for stable handlers
5. **Forms** — controlled components, `Label` + `Input` + error/description pattern

## Testing

- Unit tests for logic
- Accessibility tests (axe)
- Visual regression for UI components

```typescript
it('renders variant', () => {
  render(<Button variant="destructive">Delete</Button>)
  expect(screen.getByRole('button')).toHaveClass('bg-destructive')
})
```

## Documentation

JSDoc with example:

```typescript
/**
 * Flexible button with variants.
 * @example
 * <Button variant="outline" size="sm" onClick={fn}>Click</Button>
 */
```
