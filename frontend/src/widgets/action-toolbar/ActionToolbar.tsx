import { Button, Card, Input, Select, Space, Typography } from 'antd'
import { useState } from 'react'
import { useAppStore } from '../../app/providers/store'
import { useI18n } from '../../shared/hooks/useI18n'

type Props = {
  onSplit: (name: string) => Promise<void>
  onMerge: (targetClusterId: number) => Promise<void>
}

export const ActionToolbar = ({ onSplit, onMerge }: Props) => {
  const { state } = useAppStore()
  const t = useI18n()
  const [splitName, setSplitName] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')

  return (
    <Card>
      <Typography.Text style={{ fontWeight: 600 }}>{t.bulkActions} ({state.selectedFaceIds.length})</Typography.Text>
      <Space style={{ marginTop: 8, width: '100%' }}>
        <Input value={splitName} onChange={(event) => setSplitName(event.target.value)} placeholder={t.splitSelected} />
        <Select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)}>
          <option value="">{t.mergeCluster}</option>
          {state.clusters.map((cluster) => (
            <option key={cluster.id} value={cluster.id}>{cluster.name}</option>
          ))}
        </Select>
        <Button disabled={state.selectedFaceIds.length === 0} onClick={() => onSplit(splitName)}>{t.splitSelected}</Button>
        <Button disabled={!mergeTarget || !state.activeClusterId} onClick={() => onMerge(Number(mergeTarget))}>{t.mergeCluster}</Button>
      </Space>
    </Card>
  )
}
