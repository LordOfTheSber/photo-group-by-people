import { Button, Card, Input, Select, Space, Typography } from 'antd'
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
    <Card style={{ marginBottom: 12 }}>
      <Typography.Title style={{ fontSize: 18 }}>Clustering pipeline</Typography.Title>
      <Space style={{ width: '100%' }}>
        <Input value={folderPath} onChange={(event) => setFolderPath(event.target.value)} placeholder="/absolute/path/to/photos" />
        <Button disabled={!folderPath || busy} onClick={() => runWithRefresh(() => startScan(folderPath))}>Scan</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(runDetect)}>Detect</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(runEmbed)}>Embed</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(runCluster)}>Cluster</Button>
        <Button disabled={busy} onClick={() => runWithRefresh(async () => { await runDetect(); await runEmbed(); await runCluster() })}>Run full</Button>
      </Space>
      <Space style={{ width: '100%', marginTop: 8 }}>
        <Input value={exportPath} onChange={(event) => setExportPath(event.target.value)} placeholder="/absolute/path/to/export" />
        <Select value={exportStrategy} onChange={(event) => setExportStrategy(event.target.value as 'copy' | 'symlink' | 'hardlink')}>
          <option value="copy">copy</option>
          <option value="symlink">symlink</option>
          <option value="hardlink">hardlink</option>
        </Select>
        <Button disabled={!exportPath || busy} onClick={() => runWithRefresh(() => startExport(exportPath, exportStrategy))}>Export</Button>
      </Space>
      <div style={{ maxHeight: 180, overflow: 'auto', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
        {state.jobs.map((job) => (
          <Space key={job.id} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
            <Typography.Text>
              #{job.id} {job.job_type} · {job.status} ({job.processed_items}/{job.total_items})
            </Typography.Text>
            <Button disabled={job.error_count === 0 || busy} onClick={() => runWithRefresh(() => retryFailedItems(job.id))}>Retry failed</Button>
          </Space>
        ))}
      </div>
    </Card>
  )
}
