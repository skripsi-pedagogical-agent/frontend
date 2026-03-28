export interface AuthUser {
  id: string;
  username: string;
  name: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  name: string;
  password: string;
  password_confirm: string;
}

interface LoginResponse {
  user: AuthUser;
  refresh: string;
  access: string;
}

interface RefreshResponse {
  access: string;
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function buildApiUrl(path: string): string {
  const normalizedBase = BACKEND_BASE_URL.endsWith("/")
    ? BACKEND_BASE_URL
    : `${BACKEND_BASE_URL}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBase).toString();
}

const ACCESS_TOKEN_KEY = "bamboost.auth.access";
const REFRESH_TOKEN_KEY = "bamboost.auth.refresh";
const USER_KEY = "bamboost.auth.user";

function isBrowser() {
  return typeof window !== "undefined";
}

function parseErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.detail === "string") {
      return record.detail;
    }

    const firstValue = Object.values(record)[0];
    if (typeof firstValue === "string") {
      return firstValue;
    }

    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0];
    }
  }

  return fallback;
}

function saveSession(data: LoginResponse) {
  if (!isBrowser()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredAuthUser(): AuthUser | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() && getStoredAuthUser());
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function login(payload: LoginRequest): Promise<AuthUser> {
  const response = await fetch(buildApiUrl("api/auth/login/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Login gagal."));
  }

  const typed = data as LoginResponse;
  saveSession(typed);
  return typed.user;
}

export async function register(payload: RegisterRequest): Promise<AuthUser> {
  const response = await fetch(buildApiUrl("api/auth/register/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Register gagal."));
  }

  return data as AuthUser;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(buildApiUrl("api/auth/refresh/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const data = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    clearAuthSession();
    return null;
  }

  const typed = data as RefreshResponse;
  if (!isBrowser()) return typed.access;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, typed.access);
  return typed.access;
}
