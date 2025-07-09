# @greed-advisor/auth

Zdieľaný balíček pre autentifikáciu obsahujúci funkcie pre:

- **Hašovanie hesiel** - pomocou bcrypt
- **JWT tokeny** - generovanie a verifikácia
- **Autorizácia** - extrakcia tokenov z headerov

## Použitie

```typescript
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  extractTokenFromHeader,
} from '@greed-advisor/auth';

// Hašovanie hesla pri registrácii
const hashedPassword = await hashPassword('userpassword');

// Verifikácia hesla pri prihlásení
const isValid = await comparePassword('userpassword', hashedPassword);

// Generovanie JWT tokenu
const token = signToken({ userId: 123, email: 'user@example.com' });

// Verifikácia tokenu
const decoded = verifyToken(token);

// Extrahovanie tokenu z Authorization header
const token = extractTokenFromHeader(req.headers.get('authorization'));
```

## Závislosti

- `jsonwebtoken` - JWT tokeny
- `bcryptjs` - Hašovanie hesiel
