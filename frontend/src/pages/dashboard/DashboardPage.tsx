import { Button, Card, Image, Input, Space, Typography } from 'antd'
import { useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getJobs, getProcessingSummary } from '../../shared/api/people'
import { useI18n } from '../../shared/hooks/useI18n'
import { AppHeader } from '../../widgets/app-header/AppHeader'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'

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

      <section className="hero-section">
        <div>
          <Typography.Title className="hero-title">{t.heroTitle}</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>{t.heroSub}</Typography.Text>

          <Card style={{ marginTop: 14, display: 'inline-block' }}>
            <Space>
              <Button title="pipeline">⚙️</Button>
              <Button title="clusters">🧩</Button>
              <Button title="preview">🖼️</Button>
              <Button title="stats">📈</Button>
            </Space>
          </Card>
        </div>
        <Image src={HERO_IMAGE} alt="hero" style={{ width: '100%', maxWidth: 620, borderRadius: 18, boxShadow: 'var(--shadow-2)' }} />
      </section>

      <Card className="search-strip" style={{ marginTop: 12 }}>
        <Space style={{ width: '100%', flexWrap: 'nowrap' }}>
          <Input placeholder={t.from} />
          <Input placeholder={t.to} />
          <Input placeholder={t.when} />
          <Input placeholder={t.backTrip} />
          <Input placeholder={t.passengers} />
          <Button onClick={() => (window.location.hash = '#/clusters')}>{t.find}</Button>
        </Space>
      </Card>

      <section className="ai-block" style={{ marginTop: 14 }}>
        <div style={{ minWidth: 260 }}>
          <Typography.Title style={{ fontSize: 44 }}>{state.summary?.cluster_count ?? 0}</Typography.Title>
          <Typography.Title style={{ fontSize: 32 }}>{t.aiTitle}</Typography.Title>
          <Typography.Text style={{ color: '#1B3C25' }}>{t.aiSub}</Typography.Text>
        </div>

        <Space style={{ flex: 1 }}>
          {(state.jobs.slice(0, 3)).map((job) => (
            <Card key={job.id} className="card-hover" style={{ minWidth: 220, background: 'rgba(255,255,255,.86)' }}>
              <Typography.Text style={{ fontWeight: 700 }}>#{job.id} {job.job_type}</Typography.Text>
              <Typography.Text style={{ display: 'block', color: 'var(--muted)' }}>{job.status}</Typography.Text>
              <Typography.Text style={{ fontSize: 12 }}>{job.processed_items}/{job.total_items}</Typography.Text>
            </Card>
          ))}
        </Space>
      </section>

      {state.error && <div style={{ color: 'crimson', marginTop: 12 }}>⚠️ {state.error}</div>}
    </main>
  )
}
