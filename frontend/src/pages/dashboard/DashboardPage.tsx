import { AppHeader } from '../../widgets/app-header/AppHeader'
import { ClustersWorkspace } from '../../widgets/clusters-workspace/ClustersWorkspace'
import { FiltersPanel } from '../../widgets/filters-panel/FiltersPanel'
import { PreviewPanel } from '../../widgets/preview-panel/PreviewPanel'
import { Sidebar } from '../../widgets/sidebar/Sidebar'
import { StatisticsSummary } from '../../widgets/statistics-summary/StatisticsSummary'

export const DashboardPage = () => {
  return (
    <main style={{ padding: 16, maxWidth: 1600, margin: '0 auto' }}>
      <AppHeader />
      <StatisticsSummary />
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <FiltersPanel />
      </div>
      <section style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr) 320px', gap: 12, minHeight: '60vh' }}>
        <Sidebar />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 12 }}>
          <ClustersWorkspace />
        </div>
        <PreviewPanel />
      </section>
    </main>
  )
}
