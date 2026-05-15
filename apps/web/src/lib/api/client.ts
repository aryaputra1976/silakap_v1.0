import type { ApiEnvelope } from './types';

const TOKEN_KEY = 'silakap.accessToken';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

function getBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
}

function toUrl(path: string) {
  return `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function appendQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = toQuery(params);

  if (!query) {
    return path;
  }

  return path.includes('?') ? `${path}&${query.slice(1)}` : `${path}${query}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(toUrl(path), {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(
      'API tidak tersambung. Pastikan backend lokal berjalan dan CORS sesuai.',
      0,
    );
  }

  if (response.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new Event('silakap:unauthorized'));
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      const message = response.statusText || 'Request gagal';
      throw new ApiError(message, response.status);
    }

    return response.blob() as Promise<T>;
  }

  const payload = (await response.json()) as ApiEnvelope<T> | { message?: string };

  if (!response.ok) {
    throw new ApiError(payload.message ?? 'Request gagal', response.status);
  }

  if ('data' in payload) {
    return payload.data;
  }

  throw new ApiError('Format response API tidak valid', response.status);
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
}

export const apiClient = {
  get<T>(path: string, params: Record<string, string | number | undefined> = {}) {
    return request<T>(`${path}${toQuery(params)}`);
  },

  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  patch<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  delete<T>(path: string) {
    return request<T>(path, {
      method: 'DELETE',
    });
  },

  upload<T>(path: string, formData: FormData) {
    return request<T>(path, {
      method: 'POST',
      body: formData,
    });
  },

  async download(
    path: string,
    fileName: string,
    params: Record<string, string | number | undefined> = {},
  ) {
    const blob = await request<Blob>(appendQuery(path, params), {
      method: 'GET',
    });

    triggerBrowserDownload(blob, fileName);
  },
};
