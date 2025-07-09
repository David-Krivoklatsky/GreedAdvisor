# 📚 Greed Advisor API Documentation

## Overview
RESTful API for managing user authentication and secure storage of API keys.

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 🔐 Authentication

#### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2025-07-09T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Email already exists
- `429` - Rate limit exceeded

---

#### POST /auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2025-07-09T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `429` - Rate limit exceeded

---

### 👤 User Management

#### GET /user/profile
Get current user profile. **[Protected]**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "openAiKey": "sk-...",
    "t212Key": "xxx-xxx-xxx",
    "createdAt": "2025-07-09T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Invalid or missing token
- `404` - User not found

---

#### PUT /user/api-keys
Update user's API keys. **[Protected]**

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "openAiKey": "sk-new-key-here",
  "t212Key": "new-t212-key"
}
```

**Response (200):**
```json
{
  "message": "API keys updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "openAiKey": "sk-new-key-here",
    "t212Key": "new-t212-key",
    "updatedAt": "2025-07-09T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid or missing token

---

## Rate Limiting
- **Limit:** 100 requests per 15 minutes per IP address
- **Headers:** Response includes remaining requests in custom headers
- **Reset:** Counter resets every 15 minutes

## Error Format
All errors follow this format:
```json
{
  "error": "Human readable error message",
  "details": [...] // Optional validation details
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
