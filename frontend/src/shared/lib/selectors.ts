import type { RootState } from '../../app/providers/store'
import type { Cluster, Face } from '../types/domain'

export const selectActiveCluster = (state: RootState): Cluster | undefined =>
  state.clusters.find((cluster) => cluster.id === state.activeClusterId)

export const selectFacesForCluster = (state: RootState): Face[] => {
  if (!state.activeClusterId) return []
  return state.faces.filter((face) => face.clusterId === state.activeClusterId)
}

export const selectFilteredClusters = (state: RootState): Cluster[] => {
  const search = state.filters.search.toLowerCase()
  const filtered = state.clusters.filter(
    (cluster) => state.filters.attention.includes(cluster.attention) && cluster.name.toLowerCase().includes(search),
  )

  const sorted = [...filtered]
  if (state.filters.sortBy === 'size') sorted.sort((a, b) => b.faceIds.length - a.faceIds.length)
  if (state.filters.sortBy === 'recent') sorted.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  if (state.filters.sortBy === 'attention') {
    const rank: Record<Cluster['attention'], number> = { high: 3, medium: 2, low: 1 }
    sorted.sort((a, b) => rank[b.attention] - rank[a.attention])
  }

  return sorted
}

export const selectVisibleFaces = (state: RootState): Face[] => {
  const faces = selectFacesForCluster(state)
  return state.filters.showOnlyDisputed ? faces.filter((face) => face.status !== 'confirmed') : faces
}
