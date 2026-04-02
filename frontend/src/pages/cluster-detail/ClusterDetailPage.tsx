import { useCallback, useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getClusterDetail, getClusters } from '../../shared/api/people'
import { ClustersWorkspace } from '../../widgets/clusters-workspace/ClustersWorkspace'
import { PreviewPanel } from '../../widgets/preview-panel/PreviewPanel'

export const ClusterDetailPage = ({ clusterId }: { clusterId: number }) => {
  const { dispatch, state } = useAppStore()

  const reloadClusters = useCallback(async () => {
    const response = await getClusters({
      search: state.filters.search,
      sortBy: state.filters.sortBy,
      sortDir: state.filters.sortDir,
    })
    dispatch({ type: 'set_clusters', payload: response })
  }, [dispatch, state.filters.search, state.filters.sortBy, state.filters.sortDir])

  const reloadClusterDetail = useCallback(async () => {
    const detail = await getClusterDetail(clusterId)
    dispatch({ type: 'set_cluster_detail', payload: detail })
  }, [clusterId, dispatch])

  useEffect(() => {
    dispatch({ type: 'set_active_cluster', payload: clusterId })
    void reloadClusters()
    void reloadClusterDetail()
  }, [clusterId, dispatch, reloadClusterDetail, reloadClusters])

  return (
    <main style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>
      <button onClick={() => (window.location.hash = '#/dashboard')} style={{ marginBottom: 12 }}>
        ← Back to overview
      </button>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 12 }}>
          <ClustersWorkspace reloadClusters={reloadClusters} reloadClusterDetail={reloadClusterDetail} />
        </div>
        <PreviewPanel />
      </section>
    </main>
  )
}
