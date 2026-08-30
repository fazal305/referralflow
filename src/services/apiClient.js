export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
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
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status)
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
