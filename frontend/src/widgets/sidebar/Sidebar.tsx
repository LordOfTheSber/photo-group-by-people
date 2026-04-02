import { Card, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'

export const Sidebar = () => {
  const { state, dispatch } = useAppStore()

  return (
    <aside style={{ width: 280, borderRight: '1px solid var(--border)', paddingRight: 12, overflow: 'auto' }}>
      <Typography.Text style={{ color: 'var(--muted)', fontSize: 12 }}>Clusters: {state.clustersTotal}</Typography.Text>
      <div style={{ marginTop: 8 }}>
        {state.clusters.map((cluster) => (
          <Card
            key={cluster.id}
            className="card-hover"
            onClick={() => {
              dispatch({ type: 'set_active_cluster', payload: cluster.id })
              window.location.hash = `#/cluster/${cluster.id}`
            }}
            style={{
              cursor: 'pointer',
              borderColor: state.activeClusterId === cluster.id ? 'var(--primary)' : 'var(--border)',
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 600 }}>{cluster.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{cluster.face_count} faces · {cluster.image_count} images</div>
          </Card>
        ))}
      </div>
    </aside>
  )
}
