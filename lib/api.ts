export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Direct backend origin — no proxy. Backend serves everything under /api/*. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Absolute backend URL for non-fetch consumers (EventSource, download links). */
export const apiUrl = (path: string) => `${API_BASE}${path}`;

export async function api<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(apiUrl(path), {
    ...rest,
    credentials: "include", // cross-origin cookie auth
    headers: json
      ? { "Content-Type": "application/json", ...rest.headers }
      : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      message = Array.isArray(body.message)
        ? body.message.join(", ")
        : (body.message ?? message);
    } catch {
      /* non-json error body */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}
