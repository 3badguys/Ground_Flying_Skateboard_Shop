import request, { apiBase } from './request'
import axios from 'axios'
import { getAccessToken } from '../utils/auth'

export interface BackupItem {
  name: string
  size: number
  createdAt: string
}

/** Create a new dump on the server, returns its metadata. */
export function createBackup() {
  return request.post('/backup') as Promise<BackupItem>
}

export function getBackups() {
  return request.get('/backup/list') as Promise<BackupItem[]>
}

export function deleteBackup(name: string) {
  return request.delete(`/backup/${encodeURIComponent(name)}`)
}

export function restoreBackup(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  // Restore can take a while — relax the default 30s timeout
  return request.post('/backup/restore', fd, { timeout: 600000 }) as Promise<{
    success: boolean
  }>
}

/**
 * Download via raw axios (blob) so the JSON-unwrap response interceptor is
 * bypassed, then trigger the browser download with the auth header attached.
 */
export async function downloadBackup(name: string) {
  const res = await axios.get(
    `${apiBase}/backup/download/${encodeURIComponent(name)}`,
    {
      responseType: 'blob',
      timeout: 60000,
      headers: { Authorization: `Bearer ${getAccessToken() || ''}` },
    },
  )
  const blob = res.data as Blob
  // Error responses come back as a JSON envelope — surface the message
  if (blob.type.includes('json')) {
    const text = await blob.text()
    throw new Error(JSON.parse(text).message || '下载失败')
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
