# @greed-advisor/validations

Shared Zod schemas and validations for the entire application.

## Schemas

### `registerSchema`

Validation for user registration:

- `email` - valid email
- `password` - minimum 6 characters

### `loginSchema`

Validation for login:

- `email` - valid email
- `password` - required

### `apiKeysSchema`

Validation for API keys:

- `openAiKey` - optional OpenAI API key
- `t212Key` - optional Trading212 API key

## Usage

```typescript
import { registerSchema, loginSchema, apiKeysSchema } from '@greed-advisor/validations';

// Input data validation
const result = registerSchema.safeParse(body);
if (!result.success) {
  // Validation errors in result.error.errors
  return error;
}

// Using types
import type { RegisterInput, LoginInput, ApiKeysInput } from '@greed-advisor/validations';
```

## Dependencies

- `zod` - Runtime validations and type safety
