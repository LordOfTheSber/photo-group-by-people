import { useCallback, useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getClusterDetail, getClusters, getJobs, getProcessingSummary } from '../../shared/api/people'
import { AppHeader } from '../../widgets/app-header/AppHeader'
import { ClustersWorkspace } from '../../widgets/clusters-workspace/ClustersWorkspace'
import { FiltersPanel } from '../../widgets/filters-panel/FiltersPanel'
import { PreviewPanel } from '../../widgets/preview-panel/PreviewPanel'
import { Sidebar } from '../../widgets/sidebar/Sidebar'
import { StatisticsSummary } from '../../widgets/statistics-summary/StatisticsSummary'

export const DashboardPage = () => {
  const { state, dispatch } = useAppStore()

  const reloadClusters = useCallback(async () => {
    const response = await getClusters({
      search: state.filters.search,
      sortBy: state.filters.sortBy,
      sortDir: state.filters.sortDir,
    })
    dispatch({ type: 'set_clusters', payload: response })
  }, [dispatch, state.filters.search, state.filters.sortBy, state.filters.sortDir])

  const reloadClusterDetail = useCallback(async () => {
    if (!state.activeClusterId) return
    const detail = await getClusterDetail(state.activeClusterId)
    dispatch({ type: 'set_cluster_detail', payload: detail })
  }, [dispatch, state.activeClusterId])

  useEffect(() => {
    const load = async () => {
      dispatch({ type: 'set_loading', payload: true })
      try {
        const [summary, jobs] = await Promise.all([getProcessingSummary(), getJobs()])
        dispatch({ type: 'set_summary', payload: summary })
        dispatch({ type: 'set_jobs', payload: jobs.items })
        await reloadClusters()
        dispatch({ type: 'set_error', payload: '' })
      } catch (error) {
        dispatch({ type: 'set_error', payload: (error as Error).message })
      } finally {
        dispatch({ type: 'set_loading', payload: false })
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), 8000)
    return () => window.clearInterval(timer)
  }, [dispatch, reloadClusters])

  useEffect(() => {
    void reloadClusters()
  }, [reloadClusters])

  useEffect(() => {
    void reloadClusterDetail()
  }, [reloadClusterDetail])

  return (
    <main style={{ padding: 16, maxWidth: 1600, margin: '0 auto' }}>
      <AppHeader />
      <StatisticsSummary />
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <FiltersPanel />
      </div>
      {state.error && <div style={{ color: 'crimson', marginBottom: 12 }}>{state.error}</div>}
      <section style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr) 320px', gap: 12, minHeight: '60vh' }}>
        <Sidebar />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 12 }}>
          <ClustersWorkspace reloadClusters={reloadClusters} reloadClusterDetail={reloadClusterDetail} />
        </div>
        <PreviewPanel />
      </section>
    </main>
  )
}
