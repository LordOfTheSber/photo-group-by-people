import { Button, Card, Image, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'
import { selectVisibleFaces } from '../../shared/lib/selectors'

export const FacesGrid = ({ onRemoveFace }: { onRemoveFace: (faceId: number) => void }) => {
  const { state, dispatch } = useAppStore()
  const faces = selectVisibleFaces(state)

  if (faces.length === 0) return <div style={{ padding: 16, color: 'var(--muted)' }}>No faces in this cluster.</div>

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
      {faces.map((face) => (
        <Card
          key={face.id}
          className="card-hover"
          style={{ padding: 6, borderColor: state.selectedFaceIds.includes(face.id) ? 'var(--primary)' : 'var(--border)' }}
        >
          <Button
            style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
            onClick={() => dispatch({ type: 'toggle_face', payload: face.id })}
            aria-label={`Select face ${face.id}`}
          >
            {face.thumbnail_url ? (
              <Image
                src={face.thumbnail_url.startsWith('http') ? face.thumbnail_url : `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}${face.thumbnail_url}`}
                alt={`Face ${face.id}`}
                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10 }}
              />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10, background: 'var(--surfaceSubtle)' }} />
            )}
          </Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <Typography.Text style={{ fontSize: 12 }}>#{face.id}</Typography.Text>
            <Button onClick={() => onRemoveFace(face.id)}>Remove</Button>
          </div>
        </Card>
      ))}
    </section>
  )
}
