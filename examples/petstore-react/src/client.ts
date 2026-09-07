/**
 * The HTTP client, written once by you.
 *
 * OpenQuery generates code that imports `client` from here — it ships no
 * runtime of its own, so auth, interceptors, retries, and base URLs live in
 * your code where you can debug them.
 *
 * This example uses `fetch` to keep the dependency list at zero. An axios
 * instance satisfies the same shape, so `export const client = axios.create(…)`
 * works as a drop-in replacement.
 */

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'https://api.example.com/v1';

export interface RequestConfig {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  data?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const client = {
  async request<T>(config: RequestConfig): Promise<T> {
    const url = new URL(`${BASE_URL}${config.url}`);

    // Skip undefined so optional query params don't become "undefined".
    for (const [key, value] of Object.entries(config.params ?? {})) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      method: config.method,
      headers: {
        ...(config.data !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(config.headers as Record<string, string> | undefined),
        // Add auth here, e.g.:
        // Authorization: `Bearer ${getToken()}`,
      },
      ...(config.data !== undefined ? { body: JSON.stringify(config.data) } : {}),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ApiError(
        `${config.method} ${config.url} failed with ${response.status}`,
        response.status,
        body,
      );
    }

    // 204 and other empty responses have no body to parse.
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return (await response.json()) as T;
  },
};
