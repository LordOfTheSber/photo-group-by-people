import { useState } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getJobs, getProcessingSummary } from '../../shared/api/people'
import { retryFailedItems, runCluster, runDetect, runEmbed, startExport, startScan } from '../../shared/api/pipeline'

type Props = {
  reloadClusters: () => Promise<void>
}

export const ProcessControl = ({ reloadClusters }: Props) => {
  const { state, dispatch } = useAppStore()
  const [folderPath, setFolderPath] = useState('')
  const [exportPath, setExportPath] = useState('')
  const [exportStrategy, setExportStrategy] = useState<'copy' | 'symlink' | 'hardlink'>('copy')
  const [busy, setBusy] = useState(false)

  const refreshMeta = async () => {
    const [jobs, summary] = await Promise.all([getJobs(), getProcessingSummary()])
    dispatch({ type: 'set_jobs', payload: jobs.items })
    dispatch({ type: 'set_summary', payload: summary })
    await reloadClusters()
  }

  const runWithRefresh = async (action: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await action()
      await refreshMeta()
      dispatch({ type: 'set_error', payload: '' })
    } catch (error) {
      dispatch({ type: 'set_error', payload: (error as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 12, marginBottom: 12 }}>
      <h3 style={{ marginTop: 0 }}>Clustering pipeline</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr auto auto auto auto auto', gap: 8, marginBottom: 8 }}>
        <input value={folderPath} onChange={(event) => setFolderPath(event.target.value)} placeholder="/absolute/path/to/photos" />
        <button disabled={!folderPath || busy} onClick={() => runWithRefresh(() => startScan(folderPath))}>Scan</button>
        <button disabled={busy} onClick={() => runWithRefresh(runDetect)}>Detect</button>
        <button disabled={busy} onClick={() => runWithRefresh(runEmbed)}>Embed</button>
        <button disabled={busy} onClick={() => runWithRefresh(runCluster)}>Cluster</button>
        <button disabled={busy} onClick={() => runWithRefresh(async () => { await runDetect(); await runEmbed(); await runCluster() })}>Run full</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, marginBottom: 8 }}>
        <input value={exportPath} onChange={(event) => setExportPath(event.target.value)} placeholder="/absolute/path/to/export" />
        <select value={exportStrategy} onChange={(event) => setExportStrategy(event.target.value as 'copy' | 'symlink' | 'hardlink')}>
          <option value="copy">copy</option>
          <option value="symlink">symlink</option>
          <option value="hardlink">hardlink</option>
        </select>
        <button disabled={!exportPath || busy} onClick={() => runWithRefresh(() => startExport(exportPath, exportStrategy))}>Export</button>
      </div>

      <div style={{ maxHeight: 180, overflow: 'auto', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        {state.jobs.map((job) => (
          <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', padding: '4px 0' }}>
            <div style={{ fontSize: 13 }}>
              #{job.id} {job.job_type} · <strong>{job.status}</strong> ({job.processed_items}/{job.total_items})
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>errors: {job.error_count}</span>
            <button disabled={job.error_count === 0 || busy} onClick={() => runWithRefresh(() => retryFailedItems(job.id))}>Retry failed</button>
          </div>
        ))}
        {state.jobs.length === 0 && <div style={{ color: 'var(--muted)' }}>No jobs yet.</div>}
      </div>
    </section>
  )
}
