import type { AuthUser, LoginRequest, LoginResponse } from "@login-lab/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class InvalidCredentialsError extends Error {}

// Mode login dummy: email & password apa pun diterima, sesi disimpan di browser tanpa API.
// Matikan dengan VITE_DUMMY_LOGIN=false di apps/web/.env untuk memakai API asli.
const DUMMY_SESSION_KEY = "login-lab:dummy-user";

export function isDummyLogin(): boolean {
  return import.meta.env.VITE_DUMMY_LOGIN !== "false";
}

function readDummyUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(DUMMY_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeDummyUser(user: AuthUser | null) {
  try {
    if (user) sessionStorage.setItem(DUMMY_SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(DUMMY_SESSION_KEY);
  } catch {
    /* penyimpanan tidak tersedia; sesi hanya bertahan sampai halaman dimuat ulang */
  }
}

function call(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

export async function login(body: LoginRequest): Promise<AuthUser> {
  if (isDummyLogin()) {
    await new Promise((r) => setTimeout(r, 250));
    const user: AuthUser = { id: "dummy-user", email: body.email.trim() || "tamu" };
    writeDummyUser(user);
    return user;
  }
  const res = await call("/auth/login", { method: "POST", body: JSON.stringify(body) });
  if (res.status === 401) throw new InvalidCredentialsError();
  if (!res.ok) throw new Error(`Login gagal (${res.status})`);
  return ((await res.json()) as LoginResponse).user;
}

export async function me(): Promise<AuthUser | null> {
  if (isDummyLogin()) return readDummyUser();
  const res = await call("/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Gagal memuat sesi (${res.status})`);
  return ((await res.json()) as LoginResponse).user;
}

export async function logout(): Promise<void> {
  if (isDummyLogin()) {
    writeDummyUser(null);
    return;
  }
  await call("/auth/logout", { method: "POST" });
}
