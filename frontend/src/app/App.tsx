import { StoreProvider, useAppStore } from './providers/store'
import { AppRouter } from './router/AppRouter'
import './styles/global.css'

const Shell = () => {
  const { state } = useAppStore()
  const isDark = state.themeMode === 'dark'

  return (
    <div
      style={{
        ['--bg' as string]: isDark ? '#10131A' : '#F5F7FB',
        ['--surface' as string]: isDark ? '#171C26' : '#FFFFFF',
        ['--surfaceSubtle' as string]: isDark ? '#1E2533' : '#F8FAFD',
        ['--border' as string]: isDark ? '#2B3343' : '#E4EAF2',
        ['--text' as string]: isDark ? '#F2F5FA' : '#111827',
        ['--muted' as string]: isDark ? '#9BA6BA' : '#6B7280',
        ['--primary' as string]: '#4A7BFF',
      }}
    >
      <AppRouter />
    </div>
  )
}

export const App = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
)
