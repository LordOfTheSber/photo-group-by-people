import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { FiltersState, Job, PersonCluster, PersonDetail, ProcessingSummary } from '../../shared/types/domain'

type RootState = {
  summary: ProcessingSummary | null
  jobs: Job[]
  clusters: PersonCluster[]
  clustersTotal: number
  activeClusterId: number | null
  activeClusterDetail: PersonDetail | null
  loading: boolean
  error: string
  selectedFaceIds: number[]
  previewFaceId: number | null
  filters: FiltersState
  themeMode: 'light' | 'dark'
}

type Action =
  | { type: 'set_loading'; payload: boolean }
  | { type: 'set_error'; payload: string }
  | { type: 'set_summary'; payload: ProcessingSummary }
  | { type: 'set_jobs'; payload: Job[] }
  | { type: 'set_clusters'; payload: { items: PersonCluster[]; total: number } }
  | { type: 'set_active_cluster'; payload: number | null }
  | { type: 'set_cluster_detail'; payload: PersonDetail | null }
  | { type: 'toggle_face'; payload: number }
  | { type: 'clear_selection' }
  | { type: 'set_search'; payload: string }
  | { type: 'set_sort'; payload: { sortBy: FiltersState['sortBy']; sortDir: FiltersState['sortDir'] } }
  | { type: 'set_theme'; payload: 'light' | 'dark' }

const initialState: RootState = {
  summary: null,
  jobs: [],
  clusters: [],
  clustersTotal: 0,
  activeClusterId: null,
  activeClusterDetail: null,
  loading: false,
  error: '',
  selectedFaceIds: [],
  previewFaceId: null,
  filters: {
    search: '',
    sortBy: 'id',
    sortDir: 'asc',
    showOnlyDisputed: false,
  },
  themeMode: 'light',
}

function reducer(state: RootState, action: Action): RootState {
  switch (action.type) {
    case 'set_loading':
      return { ...state, loading: action.payload }
    case 'set_error':
      return { ...state, error: action.payload }
    case 'set_summary':
      return { ...state, summary: action.payload }
    case 'set_jobs':
      return { ...state, jobs: action.payload }
    case 'set_clusters':
      return {
        ...state,
        clusters: action.payload.items,
        clustersTotal: action.payload.total,
        activeClusterId: state.activeClusterId ?? action.payload.items[0]?.id ?? null,
      }
    case 'set_active_cluster':
      return { ...state, activeClusterId: action.payload, selectedFaceIds: [], previewFaceId: null }
    case 'set_cluster_detail':
      return { ...state, activeClusterDetail: action.payload }
    case 'toggle_face':
      return {
        ...state,
        selectedFaceIds: state.selectedFaceIds.includes(action.payload)
          ? state.selectedFaceIds.filter((id) => id !== action.payload)
          : [...state.selectedFaceIds, action.payload],
        previewFaceId: action.payload,
      }
    case 'clear_selection':
      return { ...state, selectedFaceIds: [], previewFaceId: null }
    case 'set_search':
      return { ...state, filters: { ...state.filters, search: action.payload } }
    case 'set_sort':
      return { ...state, filters: { ...state.filters, ...action.payload } }
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
