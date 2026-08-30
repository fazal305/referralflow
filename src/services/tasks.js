import { apiGet, apiPost } from './apiClient'

export function listOpenTasks() {
  return apiGet('/tasks')
}

export function createTask(payload) {
  return apiPost('/tasks', payload)
}

export function completeTask(id) {
  return apiPost(`/tasks/${id}/complete`, {})
}
