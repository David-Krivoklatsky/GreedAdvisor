// User related types
export interface User {
  id: number;
  email: string;
  password: string;
  openAiKey?: string | null;
  t212Key?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  openAiKey?: string | null;
  t212Key?: string | null;
}

export interface UserProfile {
  id: number;
  email: string;
  openAiKey?: string | null;
  t212Key?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserProfile;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Key types
export interface ApiKeyUpdate {
  openAiKey?: string | null;
  t212Key?: string | null;
}

// Error types
export interface ApiError {
  success: false;
  message: string;
  error: string;
  statusCode: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Request/Response types for specific endpoints
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends ApiResponse {
  token?: string;
  user?: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse extends ApiResponse {
  user?: UserProfile;
}

export interface UpdateApiKeysRequest {
  openAiKey?: string;
  t212Key?: string;
}

export interface UpdateApiKeysResponse extends ApiResponse {
  user?: UserProfile;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea';
  required?: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

// Database audit fields
export interface AuditFields {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
  deletedAt?: Date | null;
  deletedBy?: number;
}
