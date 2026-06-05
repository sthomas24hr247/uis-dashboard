// Centralized API client: one base URL, automatic Bearer token on every call.
const RAW = import.meta.env.VITE_API_URL || 'https://api.uishealth.com';

export const API_BASE = RAW.replace(/\/graphql$/, ''); // REST base, no trailing /graphql
export const GRAPHQL_URL = `${API_BASE}/graphql`;

function withAuth(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('uis_token');
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// Resolves the logged-in user's practice from the stored session. Returns '' if absent.
export function getPracticeId(): string {
  try {
    return JSON.parse(localStorage.getItem('uis_user') || '{}').practiceId || '';
  } catch {
    return '';
  }
}

// REST wrapper. `path` starts with '/', e.g. '/api/dashboard/practice-summary'.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: withAuth((options.headers as Record<string, string>) || {}),
  });
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

// GraphQL helper (WorkforceIntel, SettingsPage, the AI/Dentamind resolvers hit /graphql).
export async function graphqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error');
  return json.data;
}