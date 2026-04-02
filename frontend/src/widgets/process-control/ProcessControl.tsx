import { Button, Card, Input, Select, Space, Typography } from 'antd'
import { useState } from 'react'
import { useAppStore } from '../../app/providers/store'
import { getJobs, getProcessingSummary } from '../../shared/api/people'
import { useI18n } from '../../shared/hooks/useI18n'
import { retryFailedItems, runCluster, runDetect, runEmbed, startExport, startScan } from '../../shared/api/pipeline'

type Props = { reloadClusters: () => Promise<void> }

export const ProcessControl = ({ reloadClusters }: Props) => {
  const { state, dispatch } = useAppStore()
  const t = useI18n()
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
    try { await action(); await refreshMeta(); dispatch({ type: 'set_error', payload: '' }) }
    catch (error) { dispatch({ type: 'set_error', payload: (error as Error).message }) }
    finally { setBusy(false) }
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <Typography.Title style={{ fontSize: 16 }}>{t.processPipeline}</Typography.Title>
      <Space style={{ width: '100%' }}>
        <Input value={folderPath} onChange={(event) => setFolderPath(event.target.value)} placeholder="/photos" />
        <Button disabled={!folderPath || busy} onClick={() => runWithRefresh(() => startScan(folderPath))}>{t.scan}</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(runDetect)}>{t.detect}</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(runEmbed)}>{t.embed}</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(runCluster)}>{t.clusterVerb}</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(async () => { await runDetect(); await runEmbed(); await runCluster() })}>{t.runFull}</Button>
      </Space>
      <Space style={{ width: '100%', marginTop: 8 }}>
        <Input value={exportPath} onChange={(event) => setExportPath(event.target.value)} placeholder="/export" />
        <Select value={exportStrategy} onChange={(event) => setExportStrategy(event.target.value as 'copy' | 'symlink' | 'hardlink')}>
          <option value="copy">copy</option><option value="symlink">symlink</option><option value="hardlink">hardlink</option>
        </Select>
        <Button disabled={!exportPath || busy} onClick={() => runWithRefresh(() => startExport(exportPath, exportStrategy))}>{t.export}</Button>
      </Space>
      <div style={{ maxHeight: 170, overflow: 'auto', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
        {state.jobs.map((job) => (
          <Space key={job.id} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 5 }}>
            <Typography.Text style={{ fontSize: 12 }}>#{job.id} {job.job_type} · {job.status} ({job.processed_items}/{job.total_items})</Typography.Text>
            <Button disabled={job.error_count === 0 || busy} onClick={() => runWithRefresh(() => retryFailedItems(job.id))}>{t.retryFailed}</Button>
          </Space>
        ))}
        {state.jobs.length === 0 && <Typography.Text style={{ color: 'var(--muted)' }}>{t.noJobs}</Typography.Text>}
      </div>
    </Card>
  )
}
