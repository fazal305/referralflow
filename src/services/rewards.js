import { apiGet, apiPost, apiPut } from './apiClient'

export function getRewardSettings() {
  return apiGet('/rewards/settings')
}

export function saveRewardSettings(payload) {
  return apiPut('/rewards/settings', payload)
}

export function createReward(payload) {
  return apiPost('/rewards', payload)
}
