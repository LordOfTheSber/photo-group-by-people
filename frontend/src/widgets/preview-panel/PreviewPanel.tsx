import { useAppStore } from '../../app/providers/store'
import { toAssetUrl } from '../../shared/api/client'
import { selectPreviewFace } from '../../shared/lib/selectors'

export const PreviewPanel = () => {
  const { state } = useAppStore()
  const face = selectPreviewFace(state)
  if (!face) {
    return <aside style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12, color: 'var(--muted)' }}>Select a face to preview.</aside>
  }

  const image = state.activeClusterDetail?.images.find((item) => item.id === face.image_id)

  return (
    <aside style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12, width: 320 }}>
      <h3 style={{ marginTop: 0 }}>Preview</h3>
      {face.thumbnail_url && <img src={toAssetUrl(face.thumbnail_url)} alt={`Face ${face.id}`} style={{ width: '100%', borderRadius: 12, marginBottom: 10 }} />}
      {image && (
        <>
          <img src={toAssetUrl(image.preview_url)} alt={image.file_name} style={{ width: '100%', borderRadius: 12 }} />
          <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>{image.file_name}</div>
        </>
      )}
    </aside>
  )
}
