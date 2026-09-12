export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
    this.isSessionExpired = status === 401
  }
}

// Paths that are part of the auth flow itself — a 401 from these means "not
// logged in yet" or "bad credentials", not "your session expired mid-use".
const AUTH_FLOW_PATHS = ['/auth/login', '/auth/session']

let sessionExpiredHandler = null

// Registered once by the auth store so apiClient can signal a mid-session
// 401 without importing the store directly (avoids a circular import).
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })

  if (res.status === 204) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    // no body
  }

  if (!res.ok) {
    const error = new ApiError(data?.error || `Request failed (${res.status})`, res.status)
    if (error.isSessionExpired && !AUTH_FLOW_PATHS.includes(path) && sessionExpiredHandler) {
      sessionExpiredHandler()
    }
    throw error
  }
  return data
}

export const apiGet = (path) => apiFetch(path)
export const apiPost = (path, body) =>
  apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPatch = (path, body) =>
  apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
export const apiPut = (path, body) =>
  apiFetch(path, { method: 'PUT', body: JSON.stringify(body) })
export const apiDelete = (path) => apiFetch(path, { method: 'DELETE' })
