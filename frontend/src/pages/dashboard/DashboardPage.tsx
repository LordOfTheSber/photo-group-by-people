import { Button, Card, Space, Typography } from 'antd'
import { useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getJobs, getProcessingSummary } from '../../shared/api/people'
import { AppHeader } from '../../widgets/app-header/AppHeader'
import { StatisticsSummary } from '../../widgets/statistics-summary/StatisticsSummary'

export const DashboardPage = () => {
  const { dispatch, state } = useAppStore()

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, jobs] = await Promise.all([getProcessingSummary(), getJobs()])
        dispatch({ type: 'set_summary', payload: summary })
        dispatch({ type: 'set_jobs', payload: jobs.items })
      } catch (error) {
        dispatch({ type: 'set_error', payload: (error as Error).message })
      }
    }
    void load()
  }, [dispatch])

  return (
    <main className="app-shell">
      <AppHeader />
      <StatisticsSummary />
      <Space style={{ marginTop: 12, alignItems: 'stretch' }}>
        <Card className="card-hover" style={{ width: 360, borderTop: '3px solid var(--primary)' }}>
          <Typography.Title style={{ fontSize: 18 }}>Pipeline Control</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>Run scan/detect/embed/cluster/export from one place.</Typography.Text>
          <div style={{ marginTop: 10 }}><Button onClick={() => (window.location.hash = '#/pipeline')}>Open Pipeline</Button></div>
        </Card>
        <Card className="card-hover" style={{ width: 360, borderTop: '3px solid var(--primary)' }}>
          <Typography.Title style={{ fontSize: 18 }}>Cluster Review</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>Inspect faces, split/merge clusters and clean noise.</Typography.Text>
          <div style={{ marginTop: 10 }}><Button onClick={() => (window.location.hash = '#/clusters')}>Open Clusters</Button></div>
        </Card>
      </Space>
      {state.error && <div style={{ color: 'crimson', marginTop: 12 }}>{state.error}</div>}
    </main>
  )
}
