import { useAppStore } from '../../app/providers/store'
import { selectActiveCluster } from '../../shared/lib/selectors'
import { ActionToolbar } from '../action-toolbar/ActionToolbar'
import { FacesGrid } from '../faces-grid/FacesGrid'

export const ClustersWorkspace = () => {
  const { state, dispatch } = useAppStore()
  const active = selectActiveCluster(state)

  if (!active) return <div style={{ padding: 16 }}>No cluster selected.</div>

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>{active.name}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{active.faceIds.length} faces · {active.imageIds.length} images</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            defaultValue={active.name}
            onBlur={(event) => dispatch({ type: 'rename_cluster', payload: { id: active.id, name: event.target.value.trim() || active.name } })}
          />
          <button onClick={() => dispatch({ type: 'clear_selection' })}>Clear selection</button>
        </div>
      </div>
      <ActionToolbar />
      <FacesGrid />
    </section>
  )
}
