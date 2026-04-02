import { Button, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { useAppStore } from '../../app/providers/store'
import { useI18n } from '../../shared/hooks/useI18n'
import { mergeClusters, renameCluster, splitFaces, unassignFace } from '../../shared/api/people'
import { ActionToolbar } from '../action-toolbar/ActionToolbar'
import { FacesGrid } from '../faces-grid/FacesGrid'

type Props = {
  reloadClusterDetail: () => Promise<void>
  reloadClusters: () => Promise<void>
}

export const ClustersWorkspace = ({ reloadClusterDetail, reloadClusters }: Props) => {
  const { state, dispatch } = useAppStore()
  const t = useI18n()
  const [renameValue, setRenameValue] = useState(state.activeClusterDetail?.name ?? '')
  const active = state.activeClusterDetail
  if (!active) return <div style={{ padding: 16 }}>{t.selectCluster}</div>

  const handleRename = async () => {
    await renameCluster(active.id, renameValue.trim() || active.name)
    await reloadClusters(); await reloadClusterDetail()
  }
  const handleSplit = async (name: string) => {
    if (!state.activeClusterId || state.selectedFaceIds.length === 0) return
    await splitFaces(state.activeClusterId, state.selectedFaceIds, name)
    dispatch({ type: 'clear_selection' }); await reloadClusters(); await reloadClusterDetail()
  }
  const handleMerge = async (targetClusterId: number) => {
    if (!state.activeClusterId) return
    await mergeClusters(state.activeClusterId, targetClusterId)
    dispatch({ type: 'set_active_cluster', payload: targetClusterId }); await reloadClusters()
  }
  const handleRemoveFace = async (faceId: number) => {
    await unassignFace(active.id, faceId)
    await reloadClusters(); await reloadClusterDetail()
  }

  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title style={{ fontSize: 18 }}>{active.name}</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>{active.faces.length} · {active.images.length}</Typography.Text>
        </div>
        <Space>
          <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
          <Button onClick={handleRename}>✏️</Button>
          <Button onClick={() => dispatch({ type: 'clear_selection' })}>🧹</Button>
        </Space>
      </Space>
      <ActionToolbar onSplit={handleSplit} onMerge={handleMerge} />
      <FacesGrid onRemoveFace={handleRemoveFace} />
    </section>
  )
}
