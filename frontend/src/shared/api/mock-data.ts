import type { Cluster, ClusteringSession, Face, FaceImage } from '../types/domain'

export const faces: Face[] = Array.from({ length: 120 }).map((_, index) => ({
  id: index + 1,
  clusterId: (index % 12) + 1,
  imageId: (index % 40) + 1,
  confidence: 0.62 + (index % 30) / 100,
  thumbnailUrl: `https://picsum.photos/seed/face-${index + 1}/240/240`,
  status: index % 10 === 0 ? 'disputed' : index % 7 === 0 ? 'needs_review' : 'confirmed',
}))

export const images: FaceImage[] = Array.from({ length: 40 }).map((_, index) => ({
  id: index + 1,
  fileName: `IMG_${(index + 1).toString().padStart(4, '0')}.jpg`,
  previewUrl: `https://picsum.photos/seed/image-${index + 1}/640/420`,
  width: 640,
  height: 420,
}))

export const clusters: Cluster[] = Array.from({ length: 12 }).map((_, index) => {
  const id = index + 1
  const clusterFaces = faces.filter((face) => face.clusterId === id)
  const imageIds = [...new Set(clusterFaces.map((face) => face.imageId))]
  return {
    id,
    name: `Cluster #${id}`,
    faceIds: clusterFaces.map((face) => face.id),
    imageIds,
    attention: id % 4 === 0 ? 'high' : id % 3 === 0 ? 'medium' : 'low',
    updatedAt: new Date(Date.now() - id * 1000 * 60 * 15).toISOString(),
  }
})

export const session: ClusteringSession = {
  id: 'session-2026-04-02',
  totalClusters: clusters.length,
  disputedFaces: faces.filter((face) => face.status === 'disputed').length,
  unresolvedClusters: clusters.filter((cluster) => cluster.attention !== 'low').length,
  processedFaces: faces.length,
  startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
}
