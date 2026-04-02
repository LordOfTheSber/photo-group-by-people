import { Card, Image, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'
import { toAssetUrl } from '../../shared/api/client'
import { useI18n } from '../../shared/hooks/useI18n'
import { selectPreviewFace } from '../../shared/lib/selectors'

export const PreviewPanel = () => {
  const { state } = useAppStore()
  const t = useI18n()
  const face = selectPreviewFace(state)

  if (!face) return <aside style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10, color: 'var(--muted)' }}>{t.selectFacePreview}</aside>

  const image = state.activeClusterDetail?.images.find((item) => item.id === face.image_id)

  return (
    <aside style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10, width: 300 }}>
      <Card>
        <Typography.Title style={{ fontSize: 16 }}>{t.preview}</Typography.Title>
        {face.thumbnail_url && <Image src={toAssetUrl(face.thumbnail_url)} alt={`Face ${face.id}`} style={{ width: '100%', borderRadius: 10, marginBottom: 8 }} />}
        {image && (
          <>
            <Image src={toAssetUrl(image.preview_url)} alt={image.file_name} style={{ width: '100%', borderRadius: 10 }} />
            <Typography.Text style={{ marginTop: 6, display: 'block', color: 'var(--muted)', fontSize: 11 }}>{image.file_name}</Typography.Text>
          </>
        )}
      </Card>
    </aside>
  )
}
