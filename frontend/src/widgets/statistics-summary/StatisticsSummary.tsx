import { Card, Space, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'
import { useI18n } from '../../shared/hooks/useI18n'

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <Card style={{ minWidth: 180 }}>
    <Typography.Text style={{ color: 'var(--muted)' }}>{label}</Typography.Text>
    <Typography.Title style={{ fontSize: 24 }}>{value}</Typography.Title>
  </Card>
)

export const StatisticsSummary = () => {
  const { state } = useAppStore()
  const summary = state.summary
  const t = useI18n()

  return (
    <Space>
      <StatCard label={t.clustersCount} value={summary?.cluster_count ?? '—'} />
      <StatCard label={t.facesCount} value={summary?.total_faces ?? '—'} />
      <StatCard label={t.unclustered} value={summary?.unclustered_faces ?? '—'} />
      <StatCard label={t.failedImages} value={summary?.failed_images ?? '—'} />
    </Space>
  )
}
