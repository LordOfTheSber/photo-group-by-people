import { Button, Card, Space, Typography } from 'antd'
import { useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getJobs, getProcessingSummary } from '../../shared/api/people'
import { useI18n } from '../../shared/hooks/useI18n'
import { AppHeader } from '../../widgets/app-header/AppHeader'
import { StatisticsSummary } from '../../widgets/statistics-summary/StatisticsSummary'

export const DashboardPage = () => {
  const { dispatch, state } = useAppStore()
  const t = useI18n()

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
          <Typography.Title style={{ fontSize: 18 }}>⚙️ {t.pipelineTitle}</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>{t.pipelineHint}</Typography.Text>
          <div style={{ marginTop: 10 }}><Button onClick={() => (window.location.hash = '#/pipeline')}>🚀 {t.openPipeline}</Button></div>
        </Card>
        <Card className="card-hover" style={{ width: 360, borderTop: '3px solid var(--primary)' }}>
          <Typography.Title style={{ fontSize: 18 }}>🧠 {t.reviewTitle}</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>{t.reviewHint}</Typography.Text>
          <div style={{ marginTop: 10 }}><Button onClick={() => (window.location.hash = '#/clusters')}>👀 {t.openClusters}</Button></div>
        </Card>
      </Space>
      {state.error && <div style={{ color: 'crimson', marginTop: 12 }}>⚠️ {state.error}</div>}
    </main>
  )
}
