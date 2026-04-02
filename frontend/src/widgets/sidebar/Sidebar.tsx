import { Card, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'

export const Sidebar = () => {
  const { state, dispatch } = useAppStore()

  return (
    <aside style={{ width: 260, borderRight: '1px solid var(--border)', paddingRight: 10, overflow: 'auto' }}>
      <Typography.Text style={{ color: 'var(--muted)', fontSize: 11 }}>{state.clustersTotal}</Typography.Text>
      <div style={{ marginTop: 6 }}>
        {state.clusters.map((cluster) => (
          <Card key={cluster.id} className="card-hover" onClick={() => { dispatch({ type: 'set_active_cluster', payload: cluster.id }); window.location.hash = `#/cluster/${cluster.id}` }} style={{ cursor: 'pointer', borderColor: state.activeClusterId === cluster.id ? 'var(--primary)' : 'var(--border)', marginBottom: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{cluster.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>{cluster.face_count} · {cluster.image_count}</div>
          </Card>
        ))}
      </div>
    </aside>
  )
}
