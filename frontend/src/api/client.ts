export type ApiError = {
  code: string
  message: string
  details?: unknown
}


type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: ApiError | null
}

const BASE_URL = import.meta.env.VITE_API_URL || '';
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
const fullUrl = `${BASE_URL}${path}`
  const res = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const json = (await res.json()) as ApiResponse<T>

  if (!res.ok || !json.success) {
    const error: ApiError =
      json.error ?? {
        code: 'http_error',
        message: `Request failed with status ${res.status}`,
      }
    throw error
  }

  if (json.data == null) {
    throw {
      code: 'empty_data',
      message: 'Response did not contain data.',
    } satisfies ApiError
  }

  return json.data
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
}

