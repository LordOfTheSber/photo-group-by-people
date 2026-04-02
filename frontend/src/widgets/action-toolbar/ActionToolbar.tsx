import { useState } from 'react'
import { useAppStore } from '../../app/providers/store'

type Props = {
  onSplit: (name: string) => Promise<void>
  onMerge: (targetClusterId: number) => Promise<void>
}

export const ActionToolbar = ({ onSplit, onMerge }: Props) => {
  const { state } = useAppStore()
  const [splitName, setSplitName] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Bulk actions ({state.selectedFaceIds.length} selected)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
        <input value={splitName} onChange={(event) => setSplitName(event.target.value)} placeholder="New cluster name" />
        <select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)}>
          <option value="">Merge into…</option>
          {state.clusters.map((cluster) => (
            <option key={cluster.id} value={cluster.id}>
              {cluster.name}
            </option>
          ))}
        </select>
        <button disabled={state.selectedFaceIds.length === 0} onClick={() => onSplit(splitName)}>
          Split selected
        </button>
        <button disabled={!mergeTarget || !state.activeClusterId} onClick={() => onMerge(Number(mergeTarget))}>
          Merge cluster
        </button>
      </div>
    </section>
  )
}
