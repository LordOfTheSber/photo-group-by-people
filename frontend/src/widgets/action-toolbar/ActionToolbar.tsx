import { Button, Card, Input, Select, Space, Typography } from 'antd'
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
    <Card>
      <Typography.Text style={{ fontWeight: 600 }}>Bulk actions ({state.selectedFaceIds.length} selected)</Typography.Text>
      <Space style={{ marginTop: 8, width: '100%' }}>
        <Input value={splitName} onChange={(event) => setSplitName(event.target.value)} placeholder="New cluster name" />
        <Select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)}>
          <option value="">Merge into…</option>
          {state.clusters.map((cluster) => (
            <option key={cluster.id} value={cluster.id}>{cluster.name}</option>
          ))}
        </Select>
        <Button disabled={state.selectedFaceIds.length === 0} onClick={() => onSplit(splitName)}>Split selected</Button>
        <Button disabled={!mergeTarget || !state.activeClusterId} onClick={() => onMerge(Number(mergeTarget))}>Merge cluster</Button>
      </Space>
    </Card>
  )
}
