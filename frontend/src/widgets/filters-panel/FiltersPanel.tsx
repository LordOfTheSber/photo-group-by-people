import { useAppStore } from '../../app/providers/store'

export const FiltersPanel = () => {
  const { state, dispatch } = useAppStore()
  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 12,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: 10,
      }}
    >
      <input
        value={state.filters.search}
        onChange={(event) => dispatch({ type: 'set_search', payload: event.target.value })}
        placeholder="Search cluster by name"
      />
      <select value={state.filters.sortBy} onChange={(event) => dispatch({ type: 'set_sort', payload: event.target.value as never })}>
        <option value="attention">Sort: Attention</option>
        <option value="size">Sort: Cluster size</option>
        <option value="recent">Sort: Recently updated</option>
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="checkbox"
          checked={state.filters.showOnlyDisputed}
          onChange={() => dispatch({ type: 'toggle_disputed' })}
        />
        Only disputed
      </label>
      <select
        value={state.filters.attention.join(',')}
        onChange={(event) =>
          dispatch({ type: 'set_attention', payload: event.target.value === 'all' ? ['high', 'medium', 'low'] : [event.target.value as 'high' | 'medium' | 'low'] })
        }
      >
        <option value="all">Attention: All</option>
        <option value="high">Attention: High</option>
        <option value="medium">Attention: Medium</option>
        <option value="low">Attention: Low</option>
      </select>
    </section>
  )
}
