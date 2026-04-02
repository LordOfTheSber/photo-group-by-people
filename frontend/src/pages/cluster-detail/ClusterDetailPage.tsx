import { Button } from 'antd'
import { useCallback, useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getClusterDetail, getClusters } from '../../shared/api/people'
import { useI18n } from '../../shared/hooks/useI18n'
import { ClustersWorkspace } from '../../widgets/clusters-workspace/ClustersWorkspace'
import { PreviewPanel } from '../../widgets/preview-panel/PreviewPanel'

export const ClusterDetailPage = ({ clusterId }: { clusterId: number }) => {
  const { dispatch, state } = useAppStore()
  const t = useI18n()

  const reloadClusters = useCallback(async () => {
    const response = await getClusters({ search: state.filters.search, sortBy: state.filters.sortBy, sortDir: state.filters.sortDir })
    dispatch({ type: 'set_clusters', payload: response })
  }, [dispatch, state.filters.search, state.filters.sortBy, state.filters.sortDir])

  const reloadClusterDetail = useCallback(async () => {
    const detail = await getClusterDetail(clusterId)
    dispatch({ type: 'set_cluster_detail', payload: detail })
  }, [clusterId, dispatch])

  useEffect(() => {
    dispatch({ type: 'set_active_cluster', payload: clusterId })
    void reloadClusters(); void reloadClusterDetail()
  }, [clusterId, dispatch, reloadClusterDetail, reloadClusters])

  return (
    <main className="app-shell">
      <Button onClick={() => (window.location.hash = '#/clusters')} style={{ marginBottom: 10 }} title={t.back}>{t.back}</Button>
      <section className="bento-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <div className="surface" style={{ padding: 10 }}><ClustersWorkspace reloadClusters={reloadClusters} reloadClusterDetail={reloadClusterDetail} /></div>
        <PreviewPanel />
      </section>
    </main>
  )
}
