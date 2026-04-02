import { useAppStore } from '../../app/providers/store'
import { selectVisibleFaces } from '../../shared/lib/selectors'

export const FacesGrid = () => {
  const { state, dispatch } = useAppStore()
  const faces = selectVisibleFaces(state)

  if (faces.length === 0) {
    return <div style={{ padding: 16, color: 'var(--muted)' }}>No faces match current filters.</div>
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
      {faces.map((face) => (
        <button
          key={face.id}
          onClick={() => dispatch({ type: 'toggle_face', payload: face.id })}
          style={{
            borderRadius: 12,
            border: `2px solid ${state.selectedFaceIds.includes(face.id) ? 'var(--primary)' : 'var(--border)'}`,
            background: 'var(--surface)',
            padding: 4,
          }}
        >
          <img src={face.thumbnailUrl} alt={`Face ${face.id}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
            <span>#{face.id}</span>
            <span style={{ color: face.status === 'disputed' ? '#FA8C16' : 'var(--muted)' }}>{face.status}</span>
          </div>
        </button>
      ))}
    </section>
  )
}
