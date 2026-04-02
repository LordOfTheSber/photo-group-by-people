# Frontend architecture (FSD)

## Target structure

```text
src/
  app/
    providers/      # app-level providers (store, theme)
    router/         # routing composition
    styles/         # base styles and token bridge
  processes/        # reserved for cross-page flows (empty for now)
  pages/
    dashboard/
    pipeline/
    clusters/
    cluster-detail/
  widgets/
    app-header/
    sidebar/
    statistics-summary/
    process-control/
    filters-panel/
    clusters-workspace/
    faces-grid/
    action-toolbar/
    preview-panel/
  features/
    face-selection/
    cluster-merge/
    cluster-split/
    match-review/
    search-faces/
    filters-control/
    sort-clusters/
    bulk-actions/
    face-card-view/
    cluster-rename/
    export-results/
  entities/
    face/
    cluster/
    image/
    session/
    filters/
    user-action/
  shared/
    api/
    config/
    hooks/
    lib/
    types/
    ui/
```

## Redux slice layout (RTK template)

```ts
// entities/cluster/model/cluster.slice.ts
const clusterSlice = createSlice({
  name: 'cluster',
  initialState,
  reducers: {
    setActiveCluster,
    renameCluster,
    mergeClusters,
    splitCluster,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchClusters.fulfilled, ...)
  },
})
```

## State placement rules

Store globally when:
1. State is shared between pages/widgets/features.
2. State drives API requests, URL sync, or bulk actions.
3. State must survive page transitions (selection, filters, session progress).

Keep local (component state) when:
1. It's temporary UI-only state (popover open, hover index).
2. Value is used by a single component and not needed elsewhere.
3. It can be recalculated cheaply.

Current implementation is backend-first: all clustering processes are connected to backend endpoints (scan, detect, embed, cluster, retry failed, export) and review flows (list/open clusters, rename, split, merge, remove face, summary/jobs refresh).
