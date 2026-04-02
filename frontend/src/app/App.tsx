import { StoreProvider, useAppStore } from './providers/store'
import { AppRouter } from './router/AppRouter'
import './styles/global.css'

const Shell = () => {
  const { state } = useAppStore()
  const isDark = state.themeMode === 'dark'

  return (
    <div
      style={{
        ['--bg' as string]: isDark ? '#0D1A14' : '#F3FAF6',
        ['--surface' as string]: isDark ? '#13241B' : '#FFFFFF',
        ['--surfaceElevated' as string]: isDark ? '#1A2F24' : '#FFFFFF',
        ['--surfaceSubtle' as string]: isDark ? '#20382B' : '#EDF8F1',
        ['--border' as string]: isDark ? '#2E4A3A' : '#D4E9DA',
        ['--text' as string]: isDark ? '#ECF7EF' : '#102117',
        ['--muted' as string]: isDark ? '#9EB8A7' : '#5B7463',
        ['--primary' as string]: '#21A038',
        ['--primaryStrong' as string]: '#118C2A',
        ['--heroStart' as string]: isDark ? '#173224' : '#DFF0FA',
        ['--heroEnd' as string]: isDark ? '#122A1F' : '#F3FAFF',
        ['--cardSoft' as string]: isDark ? '#1A3227' : '#F4F6FA',
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
