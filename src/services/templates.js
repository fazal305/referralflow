import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient'
import { TEMPLATE_VARIABLES } from '../config/constants'

export function listTemplates() {
  return apiGet('/templates')
}

export function createTemplate(payload) {
  return apiPost('/templates', payload)
}

export function updateTemplate(id, payload) {
  return apiPatch(`/templates/${id}`, payload)
}

export function deleteTemplate(id) {
  return apiDelete(`/templates/${id}`)
}

// Safe variable replacement: only known {{variable}} tokens are substituted.
// Unknown tokens are left as-is rather than throwing, so a typo never breaks a message.
export function renderTemplate(body, values) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (!TEMPLATE_VARIABLES.includes(key)) return match
    const value = values[key]
    return value === undefined || value === null || value === '' ? match : String(value)
  })
}
