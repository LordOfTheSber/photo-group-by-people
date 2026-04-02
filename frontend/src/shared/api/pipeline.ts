import type { Job } from '../types/domain'
import { apiRequest } from './client'

export const startScan = (folderPath: string) =>
  apiRequest<{ job_id: number; status: string }>('/scan', {
    method: 'POST',
    body: JSON.stringify({ folder_path: folderPath }),
  })

export const runDetect = () => apiRequest<Job>('/faces/detect', { method: 'POST' })
export const runEmbed = () => apiRequest<Job>('/faces/embed', { method: 'POST' })
export const runCluster = () => apiRequest<Job>('/faces/cluster', { method: 'POST' })

export const retryFailedItems = (jobId: number, limit = 100) =>
  apiRequest<{ job_id: number; retried_items: number; remaining_failed_items: number }>(`/jobs/${jobId}/retry-failed`, {
    method: 'POST',
    body: JSON.stringify({ limit }),
  })

export const startExport = (outputDir: string, strategy: 'copy' | 'symlink' | 'hardlink') =>
  apiRequest<{ job_id: number; status: string }>('/export', {
    method: 'POST',
    body: JSON.stringify({ output_dir: outputDir, strategy, include_report: true }),
  })
