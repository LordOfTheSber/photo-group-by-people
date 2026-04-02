import { useAppStore } from '../../app/providers/store'

export const PreviewPanel = () => {
  const { state } = useAppStore()
  const face = state.faces.find((item) => item.id === state.previewFaceId)
  if (!face) {
    return <aside style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12, color: 'var(--muted)' }}>Select a face to preview.</aside>
  }

  const image = state.images.find((item) => item.id === face.imageId)

  return (
    <aside style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12, width: 320 }}>
      <h3 style={{ marginTop: 0 }}>Preview</h3>
      <img src={face.thumbnailUrl} alt={`Face ${face.id}`} style={{ width: '100%', borderRadius: 12, marginBottom: 10 }} />
      {image && (
        <>
          <img src={image.previewUrl} alt={image.fileName} style={{ width: '100%', borderRadius: 12 }} />
          <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>{image.fileName}</div>
        </>
      )}
    </aside>
  )
}
