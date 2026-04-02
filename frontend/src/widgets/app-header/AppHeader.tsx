import { Button, Card, Space, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'
import { useI18n } from '../../shared/hooks/useI18n'

export const AppHeader = () => {
  const { state, dispatch } = useAppStore()
  const t = useI18n()

  return (
    <Card style={{ marginBottom: 12 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <span className="brand-chip">🟢 SBER STYLE AI</span>
          <Typography.Title style={{ fontSize: 22, marginTop: 8 }}>Face Clustering Workspace</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>
            {state.summary
              ? `📊 ${state.summary.cluster_count} clusters · ${state.summary.total_faces} faces · ${state.summary.unclustered_faces} unclustered`
              : t.loadingSummary}
          </Typography.Text>
        </div>
        <Space>
          <Button onClick={() => (window.location.hash = '#/dashboard')}>🏠 {t.overview}</Button>
          <Button onClick={() => (window.location.hash = '#/pipeline')}>⚙️ {t.pipeline}</Button>
          <Button onClick={() => (window.location.hash = '#/clusters')}>🧩 {t.clusters}</Button>
          <Button onClick={() => dispatch({ type: 'set_language', payload: state.language === 'ru' ? 'en' : 'ru' })}>
            🌐 {state.language.toUpperCase()}
          </Button>
          <Button onClick={() => dispatch({ type: 'set_theme', payload: state.themeMode === 'light' ? 'dark' : 'light' })}>
            {state.themeMode === 'light' ? `🌙 ${t.darkMode}` : `☀️ ${t.lightMode}`}
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
