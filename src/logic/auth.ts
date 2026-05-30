import type { WCAUser } from './types';

const TOKEN_KEY = 'giveaway-wca-token';
const TOKEN_EXPIRY_KEY = 'giveaway-wca-token-expiry';
const USER_KEY = 'giveaway-wca-user';

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (new Date(expiry) < new Date()) {
    clearAuth();
    return null;
  }
  return token;
}

export function setToken(token: string, expiresIn: number): void {
  const expiry = new Date(Date.now() + (expiresIn - 900) * 1000);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());
}

export function getCachedUser(): WCAUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as WCAUser) : null;
}

export function setCachedUser(user: WCAUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
