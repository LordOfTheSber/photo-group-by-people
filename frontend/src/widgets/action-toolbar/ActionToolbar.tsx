import { useState } from 'react'
import { useAppStore } from '../../app/providers/store'

export const ActionToolbar = () => {
  const { state, dispatch } = useAppStore()
  const [splitName, setSplitName] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')

  const activeCluster = state.activeClusterId

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Bulk actions ({state.selectedFaceIds.length} selected)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
        <input value={splitName} onChange={(event) => setSplitName(event.target.value)} placeholder="New cluster name (for split)" />
        <select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)}>
          <option value="">Merge into…</option>
          {state.clusters.map((cluster) => (
            <option key={cluster.id} value={cluster.id}>
              {cluster.name}
            </option>
          ))}
        </select>
        <button
          disabled={!activeCluster || state.selectedFaceIds.length === 0}
          onClick={() => activeCluster && dispatch({ type: 'split_faces', payload: { sourceId: activeCluster, newName: splitName, faceIds: state.selectedFaceIds } })}
        >
          Split selected
        </button>
        <button
          disabled={!activeCluster || !mergeTarget}
          onClick={() => activeCluster && dispatch({ type: 'merge_clusters', payload: { sourceId: activeCluster, targetId: Number(mergeTarget) } })}
        >
          Merge cluster
        </button>
      </div>
    </section>
  )
}
