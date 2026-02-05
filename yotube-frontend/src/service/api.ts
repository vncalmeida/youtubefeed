const BASE_URL = import.meta.env.VITE_API_URL || 'http://77.37.43.248:5179';

export async function api<T>(path: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: T; message?: string }> {
  try {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const tokenKey = path.includes('/api/admin') ? 'adminToken' : 'token';
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(tokenKey) : null;
    let companyId: string | null = null;
    if (tokenKey === 'token') {
      companyId = typeof window !== 'undefined' ? window.localStorage.getItem('companyId') : null;
      if (!companyId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          companyId = payload.companyId ? String(payload.companyId) : null;
        } catch {
          companyId = null;
        }
      }
    }
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(companyId ? { 'x-company-id': companyId } : {}),
    } as HeadersInit;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      return { ok: false, message: `Erro ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}

export function get<T>(path: string) {
  return api<T>(path);
}

export function post<T>(path: string, payload: unknown) {
  return api<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function put<T>(path: string, payload: unknown) {
  return api<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function del<T>(path: string) {
  return api<T>(path, { method: 'DELETE' });
}
