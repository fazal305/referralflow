import { apiGet, apiPost } from './apiClient'

export function getReferrerDisplayName(code) {
  return apiGet(`/public/referrer/${code}`)
}

export function submitPublicReferral(code, form) {
  return apiPost('/public/submit-referral', {
    code,
    leadName: form.leadName,
    leadEmail: form.leadEmail || null,
    leadPhone: form.leadPhone || null,
    leadNeed: form.leadNeed || null,
    referrerName: form.referrerName || null,
    referrerEmail: form.referrerEmail || null,
    message: form.message || null,
  })
}
