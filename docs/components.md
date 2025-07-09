# Component Guidelines

## UI Component Standards

### File Organization

```
components/
├── ui/           # Primitive UI components (shadcn/ui based)
├── forms/        # Form-specific components
├── layout/       # Layout components (headers, sidebars, etc.)
└── feature/      # Feature-specific components
```

### Component Structure

Every component should follow this structure:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

// Type definitions
interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "secondary"
  size?: "sm" | "md" | "lg"
}

// Main component with forwardRef for DOM access
const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(
          "base-styles",
          variant === "secondary" && "variant-styles",
          size === "sm" && "size-styles",
          className
        )}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"

export { Component }
export type { ComponentProps }
```

### Naming Conventions

1. **Files**: Use kebab-case (`my-component.tsx`)
2. **Components**: Use PascalCase (`MyComponent`)
3. **Props**: Use camelCase with descriptive names
4. **CSS Classes**: Use Tailwind utility classes

### Best Practices

#### 1. Composition over Inheritance

```typescript
// Good: Composable button
<Button variant="ghost" size="sm">
  <Icon />
  Click me
</Button>

// Avoid: Specific button variants
<IconButton icon="heart" />
```

#### 2. Prop Interface Design

```typescript
// Good: Flexible and typed
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// Avoid: Too specific or untyped
interface ButtonProps {
  text: string;
  clickHandler: any;
}
```

#### 3. Accessibility

- Always include proper ARIA attributes
- Ensure keyboard navigation works
- Use semantic HTML elements
- Include focus management

```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

#### 4. Performance

- Use React.memo for expensive renders
- Implement proper loading states
- Avoid inline functions in JSX when possible

```typescript
// Good: Memoized expensive component
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />
})

// Good: Stable handlers
const handleClick = useCallback(() => {
  // handler logic
}, [dependency])
```

### Form Components

Form components should use controlled components pattern:

```typescript
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  description?: string
}

const FormField: React.FC<FormFieldProps & InputProps> = ({
  label,
  error,
  required,
  description,
  ...inputProps
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={inputProps.id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input {...inputProps} />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

### Testing Components

Every component should include:

1. **Unit tests** for logic
2. **Accessibility tests**
3. **Visual regression tests** (for UI components)

```typescript
// Example component test
describe('Button', () => {
  it('should render with correct variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('should be accessible', async () => {
    const { container } = render(<Button>Submit</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Component Documentation

Use JSDoc for component documentation:

````typescript
/**
 * A flexible button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="outline" size="sm" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
````
