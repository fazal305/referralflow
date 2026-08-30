import { apiGet, apiPost, apiPatch } from './apiClient'

export function listReferrals({ stage, search } = {}) {
  const params = new URLSearchParams()
  if (stage) params.set('stage', stage)
  if (search) params.set('search', search)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiGet(`/referrals${query}`)
}

export function getReferral(id) {
  return apiGet(`/referrals/${id}`)
}

export function createReferral(payload) {
  return apiPost('/referrals', payload)
}

export function updateReferralStage(id, stage) {
  return apiPatch(`/referrals/${id}`, { stage })
}

export function updateReferral(id, payload) {
  return apiPatch(`/referrals/${id}`, payload)
}

export function logEvent(referralId, eventType, description) {
  return apiPost(`/referrals/${referralId}/events`, { event_type: eventType, description })
}
