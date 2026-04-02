import { Button, Card, Space, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'

export const AppHeader = () => {
  const { state, dispatch } = useAppStore()

  return (
    <Card style={{ marginBottom: 12 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title style={{ fontSize: 22 }}>Face Clustering Workspace</Typography.Title>
          <Typography.Text style={{ color: 'var(--muted)' }}>
            {state.summary
              ? `${state.summary.cluster_count} clusters · ${state.summary.total_faces} faces · ${state.summary.unclustered_faces} unclustered`
              : 'Loading processing summary...'}
          </Typography.Text>
        </div>
        <Space>
          <Button onClick={() => (window.location.hash = '#/dashboard')}>Overview</Button>
          <Button onClick={() => (window.location.hash = '#/pipeline')}>Pipeline</Button>
          <Button onClick={() => (window.location.hash = '#/clusters')}>Clusters</Button>
          <Button onClick={() => dispatch({ type: 'set_theme', payload: state.themeMode === 'light' ? 'dark' : 'light' })}>
            {state.themeMode === 'light' ? 'Dark mode' : 'Light mode'}
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
