export type Job = {
  id: number
  job_type: string
  status: string
  total_items: number
  processed_items: number
  error_count: number
  message?: string | null
  created_at: string
  updated_at: string
}

export type ProcessingSummary = {
  total_images: number
  images_with_faces: number
  total_faces: number
  cluster_count: number
  unclustered_faces: number
  failed_images: number
  unresolved_errors: number
}

export type PersonCluster = {
  id: number
  name: string
  face_count: number
  image_count: number
  cover_face_thumbnail_url?: string | null
  created_at: string
}

export type ClusterFace = {
  id: number
  image_id: number
  thumbnail_url?: string | null
  bbox_json?: string | null
}

export type ClusterImage = {
  id: number
  file_name: string
  preview_url: string
}

export type PersonDetail = {
  id: number
  name: string
  created_at: string
  cover_face_thumbnail_url?: string | null
  faces: ClusterFace[]
  images: ClusterImage[]
}

export type ClusterMutationResponse = {
  status: string
  affected_cluster_ids: number[]
  moved_face_count: number
}

export type FiltersState = {
  search: string
  sortBy: 'id' | 'name' | 'created_at'
  sortDir: 'asc' | 'desc'
  showOnlyDisputed: boolean
}
