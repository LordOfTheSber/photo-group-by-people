import React, { createContext, useContext, useMemo, useReducer } from 'react'
import { clusters, faces, images, session } from '../../shared/api/mock-data'
import type { Cluster, ClusteringSession, Face, FaceImage, FiltersState, UserAction } from '../../shared/types/domain'

type RootState = {
  clusters: Cluster[]
  faces: Face[]
  images: FaceImage[]
  session: ClusteringSession
  filters: FiltersState
  selectedFaceIds: number[]
  activeClusterId: number | null
  previewFaceId: number | null
  actions: UserAction[]
  themeMode: 'light' | 'dark'
}

type Action =
  | { type: 'set_search'; payload: string }
  | { type: 'set_attention'; payload: Array<'high' | 'medium' | 'low'> }
  | { type: 'set_sort'; payload: FiltersState['sortBy'] }
  | { type: 'toggle_disputed' }
  | { type: 'toggle_face'; payload: number }
  | { type: 'clear_selection' }
  | { type: 'set_cluster'; payload: number | null }
  | { type: 'set_preview_face'; payload: number | null }
  | { type: 'rename_cluster'; payload: { id: number; name: string } }
  | { type: 'merge_clusters'; payload: { sourceId: number; targetId: number } }
  | { type: 'split_faces'; payload: { sourceId: number; newName: string; faceIds: number[] } }
  | { type: 'set_theme'; payload: 'light' | 'dark' }

const initialState: RootState = {
  clusters,
  faces,
  images,
  session,
  filters: {
    search: '',
    attention: ['high', 'medium', 'low'],
    sortBy: 'attention',
    showOnlyDisputed: false,
  },
  selectedFaceIds: [],
  activeClusterId: 1,
  previewFaceId: null,
  actions: [],
  themeMode: 'light',
}

const pushAction = (state: RootState, action: UserAction): RootState => ({ ...state, actions: [action, ...state.actions].slice(0, 100) })

function reducer(state: RootState, action: Action): RootState {
  switch (action.type) {
    case 'set_search':
      return { ...state, filters: { ...state.filters, search: action.payload } }
    case 'set_attention':
      return { ...state, filters: { ...state.filters, attention: action.payload } }
    case 'set_sort':
      return { ...state, filters: { ...state.filters, sortBy: action.payload } }
    case 'toggle_disputed':
      return { ...state, filters: { ...state.filters, showOnlyDisputed: !state.filters.showOnlyDisputed } }
    case 'toggle_face':
      return {
        ...state,
        selectedFaceIds: state.selectedFaceIds.includes(action.payload)
          ? state.selectedFaceIds.filter((id) => id !== action.payload)
          : [...state.selectedFaceIds, action.payload],
        previewFaceId: action.payload,
      }
    case 'clear_selection':
      return { ...state, selectedFaceIds: [] }
    case 'set_cluster':
      return { ...state, activeClusterId: action.payload, selectedFaceIds: [] }
    case 'set_preview_face':
      return { ...state, previewFaceId: action.payload }
    case 'rename_cluster': {
      const next = {
        ...state,
        clusters: state.clusters.map((cluster) => (cluster.id === action.payload.id ? { ...cluster, name: action.payload.name } : cluster)),
      }
      return pushAction(next, { id: crypto.randomUUID(), type: 'rename', createdAt: new Date().toISOString(), meta: { clusterId: action.payload.id } })
    }
    case 'merge_clusters': {
      const source = state.clusters.find((cluster) => cluster.id === action.payload.sourceId)
      const target = state.clusters.find((cluster) => cluster.id === action.payload.targetId)
      if (!source || !target || source.id === target.id) return state
      const nextClusters = state.clusters
        .filter((cluster) => cluster.id !== source.id)
        .map((cluster) =>
          cluster.id === target.id
            ? { ...cluster, faceIds: [...cluster.faceIds, ...source.faceIds], imageIds: [...new Set([...cluster.imageIds, ...source.imageIds])] }
            : cluster,
        )
      const nextFaces = state.faces.map((face) => (source.faceIds.includes(face.id) ? { ...face, clusterId: target.id } : face))
      const next = { ...state, clusters: nextClusters, faces: nextFaces, activeClusterId: target.id, selectedFaceIds: [] }
      return pushAction(next, { id: crypto.randomUUID(), type: 'merge', createdAt: new Date().toISOString(), meta: { sourceId: source.id, targetId: target.id } })
    }
    case 'split_faces': {
      const source = state.clusters.find((cluster) => cluster.id === action.payload.sourceId)
      if (!source || action.payload.faceIds.length === 0) return state
      const newClusterId = Math.max(...state.clusters.map((cluster) => cluster.id)) + 1
      const movingFaceSet = new Set(action.payload.faceIds)
      const movingFaces = state.faces.filter((face) => movingFaceSet.has(face.id))
      const nextClusters = state.clusters.map((cluster) =>
        cluster.id === source.id ? { ...cluster, faceIds: cluster.faceIds.filter((id) => !movingFaceSet.has(id)) } : cluster,
      )
      nextClusters.push({
        id: newClusterId,
        name: action.payload.newName || `Cluster #${newClusterId}`,
        faceIds: movingFaces.map((face) => face.id),
        imageIds: [...new Set(movingFaces.map((face) => face.imageId))],
        attention: 'medium',
        updatedAt: new Date().toISOString(),
      })
      const nextFaces = state.faces.map((face) => (movingFaceSet.has(face.id) ? { ...face, clusterId: newClusterId } : face))
      const next = { ...state, clusters: nextClusters, faces: nextFaces, activeClusterId: newClusterId, selectedFaceIds: [] }
      return pushAction(next, {
        id: crypto.randomUUID(),
        type: 'split',
        createdAt: new Date().toISOString(),
        meta: { sourceId: source.id, targetId: newClusterId, count: action.payload.faceIds.length },
      })
    }
    case 'set_theme':
      return { ...state, themeMode: action.payload }
    default:
      return state
  }
}

const StoreContext = createContext<{ state: RootState; dispatch: React.Dispatch<Action> } | null>(null)

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useAppStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('StoreProvider is missing')
  return context
}

export type { RootState, Action }
