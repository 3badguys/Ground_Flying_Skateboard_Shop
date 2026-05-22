import request from './request'

export function getSettings() {
  return request.get('/settings') as Promise<Record<string, string>>
}

export function updateSetting(key: string, value: string) {
  return request.put('/settings', { key, value })
}
