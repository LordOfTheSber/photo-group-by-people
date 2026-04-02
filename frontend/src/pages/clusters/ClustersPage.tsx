import { useCallback, useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getClusterDetail, getClusters } from '../../shared/api/people'
import { AppHeader } from '../../widgets/app-header/AppHeader'
import { ClustersWorkspace } from '../../widgets/clusters-workspace/ClustersWorkspace'
import { FiltersPanel } from '../../widgets/filters-panel/FiltersPanel'
import { PreviewPanel } from '../../widgets/preview-panel/PreviewPanel'
import { Sidebar } from '../../widgets/sidebar/Sidebar'

export const ClustersPage = () => {
  const { state, dispatch } = useAppStore()

  const reloadClusters = useCallback(async () => {
    const response = await getClusters({ search: state.filters.search, sortBy: state.filters.sortBy, sortDir: state.filters.sortDir })
    dispatch({ type: 'set_clusters', payload: response })
  }, [dispatch, state.filters.search, state.filters.sortBy, state.filters.sortDir])

  const reloadClusterDetail = useCallback(async () => {
    if (!state.activeClusterId) return
    const detail = await getClusterDetail(state.activeClusterId)
    dispatch({ type: 'set_cluster_detail', payload: detail })
  }, [dispatch, state.activeClusterId])

  useEffect(() => {
    void reloadClusters()
  }, [reloadClusters])

  useEffect(() => {
    void reloadClusterDetail()
  }, [reloadClusterDetail])

  return (
    <main className="app-shell">
      <AppHeader />
      <FiltersPanel />
      <section className="bento-grid" style={{ marginTop: 12 }}>
        <Sidebar />
        <div className="surface" style={{ padding: 12 }}>
          <ClustersWorkspace reloadClusters={reloadClusters} reloadClusterDetail={reloadClusterDetail} />
        </div>
        <PreviewPanel />
      </section>
    </main>
  )
}
