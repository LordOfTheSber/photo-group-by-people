import { useAppStore } from '../../app/providers/store'

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: 26 }}>{value}</div>
  </div>
)

export const StatisticsSummary = () => {
  const { state } = useAppStore()
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12 }}>
      <Stat label="Clusters" value={state.session.totalClusters} />
      <Stat label="Faces processed" value={state.session.processedFaces} />
      <Stat label="Disputed" value={state.session.disputedFaces} />
      <Stat label="Need attention" value={state.session.unresolvedClusters} />
    </section>
  )
}
