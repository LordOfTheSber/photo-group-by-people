import { useState } from 'react'
import { useAppStore } from '../../app/providers/store'
import { mergeClusters, renameCluster, splitFaces, unassignFace } from '../../shared/api/people'
import { ActionToolbar } from '../action-toolbar/ActionToolbar'
import { FacesGrid } from '../faces-grid/FacesGrid'

type Props = {
  reloadClusterDetail: () => Promise<void>
  reloadClusters: () => Promise<void>
}

export const ClustersWorkspace = ({ reloadClusterDetail, reloadClusters }: Props) => {
  const { state, dispatch } = useAppStore()
  const [renameValue, setRenameValue] = useState(state.activeClusterDetail?.name ?? '')

  const active = state.activeClusterDetail

  if (!active) return <div style={{ padding: 16 }}>Select cluster from sidebar.</div>

  const handleRename = async () => {
    await renameCluster(active.id, renameValue.trim() || active.name)
    await reloadClusters()
    await reloadClusterDetail()
  }

  const handleSplit = async (name: string) => {
    if (!state.activeClusterId || state.selectedFaceIds.length === 0) return
    await splitFaces(state.activeClusterId, state.selectedFaceIds, name)
    dispatch({ type: 'clear_selection' })
    await reloadClusters()
    await reloadClusterDetail()
  }

  const handleMerge = async (targetClusterId: number) => {
    if (!state.activeClusterId) return
    await mergeClusters(state.activeClusterId, targetClusterId)
    dispatch({ type: 'set_active_cluster', payload: targetClusterId })
    await reloadClusters()
  }

  const handleRemoveFace = async (faceId: number) => {
    await unassignFace(active.id, faceId)
    await reloadClusters()
    await reloadClusterDetail()
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>{active.name}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{active.faces.length} faces · {active.images.length} images</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
          <button onClick={handleRename}>Rename</button>
          <button onClick={() => dispatch({ type: 'clear_selection' })}>Clear selection</button>
        </div>
      </div>
      <ActionToolbar onSplit={handleSplit} onMerge={handleMerge} />
      <FacesGrid onRemoveFace={handleRemoveFace} />
    </section>
  )
}
