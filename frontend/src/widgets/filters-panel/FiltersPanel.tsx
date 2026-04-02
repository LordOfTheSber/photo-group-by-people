import { Card, Input, Select, Space } from 'antd'
import { useAppStore } from '../../app/providers/store'

export const FiltersPanel = () => {
  const { state, dispatch } = useAppStore()
  return (
    <Card>
      <Space style={{ width: '100%' }}>
        <Input
          value={state.filters.search}
          onChange={(event) => dispatch({ type: 'set_search', payload: event.target.value })}
          placeholder="Search clusters by name prefix"
        />
        <Select
          value={state.filters.sortBy}
          onChange={(event) => dispatch({ type: 'set_sort', payload: { sortBy: event.target.value as 'id' | 'name' | 'created_at', sortDir: state.filters.sortDir } })}
        >
          <option value="id">Sort: ID</option>
          <option value="name">Sort: Name</option>
          <option value="created_at">Sort: Created</option>
        </Select>
        <Select
          value={state.filters.sortDir}
          onChange={(event) => dispatch({ type: 'set_sort', payload: { sortBy: state.filters.sortBy, sortDir: event.target.value as 'asc' | 'desc' } })}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Select>
      </Space>
    </Card>
  )
}
