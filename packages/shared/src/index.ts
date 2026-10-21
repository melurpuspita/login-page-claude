export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface ApiError {
  error: string;
}

export const MAX_PASSWORD_LENGTH = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isLoginRequest(value: unknown): value is LoginRequest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.email !== "string" || typeof v.password !== "string") return false;
  return (
    EMAIL_PATTERN.test(v.email.trim()) &&
    v.password.length > 0 &&
    v.password.length <= MAX_PASSWORD_LENGTH
  );
}
