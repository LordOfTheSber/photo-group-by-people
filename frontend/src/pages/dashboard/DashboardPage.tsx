import { Button, Card, Image, Space, Typography } from 'antd'
import { useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getJobs, getProcessingSummary } from '../../shared/api/people'
import { useI18n } from '../../shared/hooks/useI18n'
import { AppHeader } from '../../widgets/app-header/AppHeader'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=1200&q=80'
const PROMOS = [
  { title: 'Быстрая проверка', subtitle: 'до 99% точности', image: 'https://images.unsplash.com/photo-1580983218765-f663bec07b37?auto=format&fit=crop&w=400&q=80' },
  { title: 'Экономия времени', subtitle: 'массовые действия', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
  { title: 'Персональные подборки', subtitle: 'AI рекомендации', image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80' },
  { title: 'Поддержка 24/7', subtitle: 'единый workflow', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=400&q=80' },
]

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
          <Space style={{ marginTop: 14 }}>
            <Button onClick={() => (window.location.hash = '#/pipeline')}>{t.openPipeline}</Button>
            <Button onClick={() => (window.location.hash = '#/clusters')}>{t.openClusters}</Button>
          </Space>
        </div>
        <Image src={HERO_IMAGE} alt="hero" style={{ width: '100%', maxWidth: 620, borderRadius: 18, boxShadow: 'var(--shadow-2)' }} />
      </section>

      <section className="promo-grid" style={{ marginTop: 14 }}>
        {PROMOS.map((item) => (
          <Card key={item.title} className="promo-card">
            <Typography.Title style={{ fontSize: 22 }}>{item.title}</Typography.Title>
            <Typography.Text style={{ color: 'var(--muted)' }}>{item.subtitle}</Typography.Text>
            <Image src={item.image} alt={item.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
          </Card>
        ))}
      </section>

      {state.error && <div style={{ color: 'crimson', marginTop: 12 }}>{state.error}</div>}
    </main>
  )
}
