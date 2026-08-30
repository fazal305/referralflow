import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient'

export function listClients({ search } = {}) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiGet(`/clients${query}`)
}

export function getClient(id) {
  return apiGet(`/clients/${id}`)
}

export function createClient(payload) {
  return apiPost('/clients', payload)
}

export function updateClient(id, payload) {
  return apiPatch(`/clients/${id}`, payload)
}

export function deleteClient(id) {
  return apiDelete(`/clients/${id}`)
}

export function ensureReferralCode(clientId) {
  return apiPost(`/clients/${clientId}/referral-code`, {})
}
