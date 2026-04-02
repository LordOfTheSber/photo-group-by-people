import { useEffect } from 'react'
import { useAppStore } from '../../app/providers/store'
import { ClustersWorkspace } from '../../widgets/clusters-workspace/ClustersWorkspace'
import { PreviewPanel } from '../../widgets/preview-panel/PreviewPanel'

export const ClusterDetailPage = ({ clusterId }: { clusterId: number }) => {
  const { state, dispatch } = useAppStore()

  useEffect(() => {
    if (state.activeClusterId !== clusterId) dispatch({ type: 'set_cluster', payload: clusterId })
  }, [clusterId, dispatch, state.activeClusterId])

  return (
    <main style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>
      <button onClick={() => (window.location.hash = '#/dashboard')} style={{ marginBottom: 12 }}>
        ← Back to overview
      </button>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 12 }}>
          <ClustersWorkspace />
        </div>
        <PreviewPanel />
      </section>
    </main>
  )
}
