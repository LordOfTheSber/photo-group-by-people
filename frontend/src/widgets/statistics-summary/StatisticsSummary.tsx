import { useAppStore } from '../../app/providers/store'

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: 24 }}>{value}</div>
  </div>
)

export const StatisticsSummary = () => {
  const { state } = useAppStore()
  const summary = state.summary

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12 }}>
      <Stat label="Clusters" value={summary?.cluster_count ?? '—'} />
      <Stat label="Faces" value={summary?.total_faces ?? '—'} />
      <Stat label="Unclustered" value={summary?.unclustered_faces ?? '—'} />
      <Stat label="Failed images" value={summary?.failed_images ?? '—'} />
    </section>
  )
}
