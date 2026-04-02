import { useAppStore } from '../../app/providers/store'

export const Sidebar = () => {
  const { state, dispatch } = useAppStore()

  return (
    <aside style={{ width: 280, borderRight: '1px solid var(--border)', paddingRight: 12, overflow: 'auto' }}>
      <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>Clusters: {state.clustersTotal}</div>
      {state.clusters.map((cluster) => (
        <button
          key={cluster.id}
          onClick={() => {
            dispatch({ type: 'set_active_cluster', payload: cluster.id })
            window.location.hash = `#/cluster/${cluster.id}`
          }}
          style={{
            width: '100%',
            textAlign: 'left',
            border: `1px solid ${state.activeClusterId === cluster.id ? 'var(--primary)' : 'var(--border)'}`,
            background: 'var(--surface)',
            borderRadius: 12,
            padding: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 600 }}>{cluster.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>{cluster.face_count} faces · {cluster.image_count} images</div>
        </button>
      ))}
    </aside>
  )
}
