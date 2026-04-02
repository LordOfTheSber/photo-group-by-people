import { Button, Card, Space, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'
import { useI18n } from '../../shared/hooks/useI18n'
import { ClusterIcon, GlobeIcon, HomeIcon, PipelineIcon, ThemeIcon } from '../../shared/ui/icons'

export const AppHeader = () => {
  const { state, dispatch } = useAppStore()
  const t = useI18n()

  return (
    <Card style={{ marginBottom: 12 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <span className="brand-chip">SBER STYLE AI</span>
          <Typography.Title style={{ fontSize: 20, marginTop: 8 }}>Face Clustering Workspace</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)', fontSize: 13 }}>
            {state.summary
              ? `${state.summary.cluster_count} · ${state.summary.total_faces} · ${state.summary.unclustered_faces}`
              : t.loadingSummary}
          </Typography.Text>
        </div>
        <Space>
          <Button title={t.overview} aria-label={t.overview} onClick={() => (window.location.hash = '#/dashboard')}><HomeIcon /></Button>
          <Button title={t.pipeline} aria-label={t.pipeline} onClick={() => (window.location.hash = '#/pipeline')}><PipelineIcon /></Button>
          <Button title={t.clusters} aria-label={t.clusters} onClick={() => (window.location.hash = '#/clusters')}><ClusterIcon /></Button>
          <Button title={`${state.language.toUpperCase()}`} aria-label="language" onClick={() => dispatch({ type: 'set_language', payload: state.language === 'ru' ? 'en' : 'ru' })}>
            <GlobeIcon />
          </Button>
          <Button title={state.themeMode === 'light' ? t.darkMode : t.lightMode} aria-label="theme" onClick={() => dispatch({ type: 'set_theme', payload: state.themeMode === 'light' ? 'dark' : 'light' })}>
            <ThemeIcon />
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
