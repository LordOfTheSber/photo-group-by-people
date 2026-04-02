import { Button, Card, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useAppStore } from '../../app/providers/store'

const PAGE_SIZE = 15

export const Sidebar = () => {
  const { state, dispatch } = useAppStore()
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(state.clusters.length / PAGE_SIZE))
  const start = page * PAGE_SIZE
  const visible = useMemo(() => state.clusters.slice(start, start + PAGE_SIZE), [start, state.clusters])

  return (
    <aside style={{ width: 280, borderRight: '1px solid var(--border)', paddingRight: 10, overflow: 'auto' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text style={{ color: 'var(--muted)', fontSize: 11 }}>{state.clustersTotal}</Typography.Text>
        <Typography.Text style={{ color: 'var(--muted)', fontSize: 11 }}>{page + 1}/{pageCount}</Typography.Text>
      </Space>

      <div style={{ marginTop: 6 }}>
        {visible.map((cluster) => (
          <Card key={cluster.id} className="card-hover" onClick={() => { dispatch({ type: 'set_active_cluster', payload: cluster.id }) }} style={{ cursor: 'pointer', borderColor: state.activeClusterId === cluster.id ? 'var(--primary)' : 'var(--border)', marginBottom: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{cluster.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>{cluster.face_count} · {cluster.image_count}</div>
          </Card>
        ))}
      </div>

      <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 6 }}>
        <Button disabled={page === 0} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>Prev</Button>
        <Button disabled={page >= pageCount - 1} onClick={() => setPage((prev) => Math.min(pageCount - 1, prev + 1))}>Next</Button>
      </Space>
    </aside>
  )
}
