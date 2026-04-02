export type Face = {
  id: number
  clusterId: number
  imageId: number
  confidence: number
  thumbnailUrl: string
  status: 'confirmed' | 'disputed' | 'needs_review'
}

export type FaceImage = {
  id: number
  fileName: string
  previewUrl: string
  width: number
  height: number
}

export type Cluster = {
  id: number
  name: string
  faceIds: number[]
  imageIds: number[]
  attention: 'high' | 'medium' | 'low'
  updatedAt: string
}

export type ClusteringSession = {
  id: string
  totalClusters: number
  disputedFaces: number
  unresolvedClusters: number
  processedFaces: number
  startedAt: string
}

export type FiltersState = {
  search: string
  attention: Array<'high' | 'medium' | 'low'>
  sortBy: 'size' | 'recent' | 'attention'
  showOnlyDisputed: boolean
}

export type UserAction = {
  id: string
  type: 'merge' | 'split' | 'rename' | 'approve' | 'reject' | 'export'
  createdAt: string
  meta: Record<string, string | number>
}
