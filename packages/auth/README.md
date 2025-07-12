# @greed-advisor/auth

Shared package for authentication containing functions for:

- **Password hashing** - using bcrypt
- **JWT tokens** - generation and verification
- **Authorization** - token extraction from headers

## Usage

```typescript
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  extractTokenFromHeader,
} from '@greed-advisor/auth';

// Password hashing during registration
const hashedPassword = await hashPassword('userpassword');

// Password verification during login
const isValid = await comparePassword('userpassword', hashedPassword);

// JWT token generation
const token = signToken({ userId: 123, email: 'user@example.com' });

// Token verification
const decoded = verifyToken(token);

// Token extraction from Authorization header
const token = extractTokenFromHeader(req.headers.get('authorization'));
```

## Dependencies

- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
