import { useAppStore } from '../../app/providers/store'

export const AppHeader = () => {
  const { state, dispatch } = useAppStore()

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>Face Clustering Workspace</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
          {state.summary
            ? `${state.summary.cluster_count} clusters · ${state.summary.total_faces} faces · ${state.summary.unclustered_faces} unclustered`
            : 'Loading processing summary...'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => (window.location.hash = '#/dashboard')}>Dashboard</button>
        <button onClick={() => dispatch({ type: 'set_theme', payload: state.themeMode === 'light' ? 'dark' : 'light' })}>
          {state.themeMode === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
      </div>
    </header>
  )
}
