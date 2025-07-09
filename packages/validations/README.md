# @greed-advisor/validations

Zdieľané Zod schémy a validácie pre celú aplikáciu.

## Schémy

### `registerSchema`
Validácia pre registráciu používateľa:
- `email` - validný email
- `password` - minimálne 6 znakov

### `loginSchema`
Validácia pre prihlásenie:
- `email` - validný email  
- `password` - povinné

### `apiKeysSchema`
Validácia pre API kľúče:
- `openAiKey` - nepovinný OpenAI API kľúč
- `t212Key` - nepovinný Trading212 API kľúč

## Použitie

```typescript
import { registerSchema, loginSchema, apiKeysSchema } from '@greed-advisor/validations'

// Validácia vstupných dát
const result = registerSchema.safeParse(body)
if (!result.success) {
  // Chyby validácie v result.error.errors
  return error
}

// Použitie typov
import type { RegisterInput, LoginInput, ApiKeysInput } from '@greed-advisor/validations'
```

## Závislosti

- `zod` - Runtime validácie a typová bezpečnosť
