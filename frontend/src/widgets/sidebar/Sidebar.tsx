import { useAppStore } from '../../app/providers/store'
import { selectFilteredClusters } from '../../shared/lib/selectors'

export const Sidebar = () => {
  const { state, dispatch } = useAppStore()
  const clusters = selectFilteredClusters(state)

  return (
    <aside style={{ width: 280, borderRight: '1px solid var(--border)', paddingRight: 12, overflow: 'auto' }}>
      {clusters.map((cluster) => (
        <button
          key={cluster.id}
          onClick={() => {
            dispatch({ type: 'set_cluster', payload: cluster.id })
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
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>{cluster.faceIds.length} faces · attention: {cluster.attention}</div>
        </button>
      ))}
    </aside>
  )
}
