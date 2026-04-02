import { Card, Input, Select, Space } from 'antd'
import { useAppStore } from '../../app/providers/store'
import { useI18n } from '../../shared/hooks/useI18n'

export const FiltersPanel = () => {
  const { state, dispatch } = useAppStore()
  const t = useI18n()
  return (
    <Card>
      <Space style={{ width: '100%' }}>
        <Input
          value={state.filters.search}
          onChange={(event) => dispatch({ type: 'set_search', payload: event.target.value })}
          placeholder={t.searchClusters}
        />
        <Select
          value={state.filters.sortBy}
          onChange={(event) => dispatch({ type: 'set_sort', payload: { sortBy: event.target.value as 'id' | 'name' | 'created_at', sortDir: state.filters.sortDir } })}
        >
          <option value="id">{t.sortId}</option>
          <option value="name">{t.sortName}</option>
          <option value="created_at">{t.sortCreated}</option>
        </Select>
        <Select
          value={state.filters.sortDir}
          onChange={(event) => dispatch({ type: 'set_sort', payload: { sortBy: state.filters.sortBy, sortDir: event.target.value as 'asc' | 'desc' } })}
        >
          <option value="asc">{t.asc}</option>
          <option value="desc">{t.desc}</option>
        </Select>
      </Space>
    </Card>
  )
}
