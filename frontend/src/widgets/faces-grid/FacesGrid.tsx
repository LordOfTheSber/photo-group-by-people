import { useAppStore } from '../../app/providers/store'
import { selectVisibleFaces } from '../../shared/lib/selectors'

export const FacesGrid = ({ onRemoveFace }: { onRemoveFace: (faceId: number) => void }) => {
  const { state, dispatch } = useAppStore()
  const faces = selectVisibleFaces(state)

  if (faces.length === 0) {
    return <div style={{ padding: 16, color: 'var(--muted)' }}>No faces in this cluster.</div>
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
      {faces.map((face) => (
        <div
          key={face.id}
          style={{
            borderRadius: 12,
            border: `2px solid ${state.selectedFaceIds.includes(face.id) ? 'var(--primary)' : 'var(--border)'}`,
            background: 'var(--surface)',
            padding: 6,
          }}
        >
          <button style={{ width: '100%', border: 'none', background: 'transparent', padding: 0 }} onClick={() => dispatch({ type: 'toggle_face', payload: face.id })}>
            {face.thumbnail_url ? (
              <img src={face.thumbnail_url.startsWith('http') ? face.thumbnail_url : `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}${face.thumbnail_url}`} alt={`Face ${face.id}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10 }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10, background: 'var(--surfaceSubtle)' }} />
            )}
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
            <span>#{face.id}</span>
            <button onClick={() => onRemoveFace(face.id)}>Remove</button>
          </div>
        </div>
      ))}
    </section>
  )
}
