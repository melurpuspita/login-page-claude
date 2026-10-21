import type { AuthUser, LoginRequest, LoginResponse } from "@login-lab/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class InvalidCredentialsError extends Error {}

function call(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

export async function login(body: LoginRequest): Promise<AuthUser> {
  const res = await call("/auth/login", { method: "POST", body: JSON.stringify(body) });
  if (res.status === 401) throw new InvalidCredentialsError();
  if (!res.ok) throw new Error(`Login gagal (${res.status})`);
  return ((await res.json()) as LoginResponse).user;
}

export async function me(): Promise<AuthUser | null> {
  const res = await call("/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Gagal memuat sesi (${res.status})`);
  return ((await res.json()) as LoginResponse).user;
}

export async function logout(): Promise<void> {
  await call("/auth/logout", { method: "POST" });
}
