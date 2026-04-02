import { useCallback, useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getClusters, getJobs, getProcessingSummary } from '../../shared/api/people'
import { AppHeader } from '../../widgets/app-header/AppHeader'
import { ProcessControl } from '../../widgets/process-control/ProcessControl'
import { StatisticsSummary } from '../../widgets/statistics-summary/StatisticsSummary'

export const PipelinePage = () => {
  const { state, dispatch } = useAppStore()

  const reloadClusters = useCallback(async () => {
    const response = await getClusters({ search: state.filters.search, sortBy: state.filters.sortBy, sortDir: state.filters.sortDir })
    dispatch({ type: 'set_clusters', payload: response })
  }, [dispatch, state.filters.search, state.filters.sortBy, state.filters.sortDir])

  useEffect(() => {
    const load = async () => {
      const [summary, jobs] = await Promise.all([getProcessingSummary(), getJobs()])
      dispatch({ type: 'set_summary', payload: summary })
      dispatch({ type: 'set_jobs', payload: jobs.items })
    }
    void load()
  }, [dispatch])

  return (
    <main style={{ padding: 16, maxWidth: 1280, margin: '0 auto' }}>
      <AppHeader />
      <StatisticsSummary />
      <ProcessControl reloadClusters={reloadClusters} />
    </main>
  )
}
