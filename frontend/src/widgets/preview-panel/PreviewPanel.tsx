import { Card, Image, Typography } from 'antd'
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
      <Card>
        <Typography.Title style={{ fontSize: 18 }}>Preview</Typography.Title>
        {face.thumbnail_url && <Image src={toAssetUrl(face.thumbnail_url)} alt={`Face ${face.id}`} style={{ width: '100%', borderRadius: 12, marginBottom: 10 }} />}
        {image && (
          <>
            <Image src={toAssetUrl(image.preview_url)} alt={image.file_name} style={{ width: '100%', borderRadius: 12 }} />
            <Typography.Text style={{ marginTop: 6, display: 'block', color: 'var(--muted)', fontSize: 12 }}>{image.file_name}</Typography.Text>
          </>
        )}
      </Card>
    </aside>
  )
}
