import { Card, Space, Typography } from 'antd'
import { useAppStore } from '../../app/providers/store'

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <Card style={{ minWidth: 180 }}>
    <Typography.Text style={{ color: 'var(--muted)' }}>{label}</Typography.Text>
    <Typography.Title style={{ fontSize: 24 }}>{value}</Typography.Title>
  </Card>
)

export const StatisticsSummary = () => {
  const { state } = useAppStore()
  const summary = state.summary

  return (
    <Space>
      <StatCard label="Clusters" value={summary?.cluster_count ?? '—'} />
      <StatCard label="Faces" value={summary?.total_faces ?? '—'} />
      <StatCard label="Unclustered" value={summary?.unclustered_faces ?? '—'} />
      <StatCard label="Failed images" value={summary?.failed_images ?? '—'} />
    </Space>
  )
}
