import type { ClusterMutationResponse, Job, PersonCluster, PersonDetail, ProcessingSummary } from '../types/domain'
import { apiRequest } from './client'

export const getProcessingSummary = () => apiRequest<ProcessingSummary>('/reports/processing-summary')
export const getJobs = () => apiRequest<{ items: Job[]; total: number }>('/jobs?limit=30')

export const getClusters = (params: { search?: string; sortBy: 'id' | 'name' | 'created_at'; sortDir: 'asc' | 'desc' }) => {
  const query = new URLSearchParams({ limit: '200', offset: '0', sort_by: params.sortBy, sort_dir: params.sortDir })
  if (params.search?.trim()) query.set('search', params.search.trim())
  return apiRequest<{ items: PersonCluster[]; total: number }>(`/people?${query.toString()}`)
}

export const getClusterDetail = (clusterId: number) => apiRequest<PersonDetail>(`/people/${clusterId}`)
export const renameCluster = (clusterId: number, name: string) =>
  apiRequest<PersonCluster>(`/people/${clusterId}`, { method: 'PATCH', body: JSON.stringify({ name }) })

export const splitFaces = (sourceClusterId: number, faceIds: number[], destinationName?: string) =>
  apiRequest<ClusterMutationResponse>('/people/split', {
    method: 'POST',
    body: JSON.stringify({ source_cluster_id: sourceClusterId, face_ids: faceIds, destination_cluster_name: destinationName || undefined }),
  })

export const mergeClusters = (sourceClusterId: number, targetClusterId: number) =>
  apiRequest<ClusterMutationResponse>('/people/merge', {
    method: 'POST',
    body: JSON.stringify({ source_cluster_ids: [sourceClusterId], target_cluster_id: targetClusterId }),
  })

export const unassignFace = (clusterId: number, faceId: number) =>
  apiRequest(`/people/${clusterId}/faces/${faceId}`, { method: 'DELETE' })
