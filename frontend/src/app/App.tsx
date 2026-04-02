import { useEffect } from 'react'
import { StoreProvider, useAppStore } from './providers/store'
import { AppRouter } from './router/AppRouter'
import './styles/global.css'

const Shell = () => {
  const { state } = useAppStore()

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', state.themeMode)
  }, [state.themeMode])

  return <AppRouter />
}

export const App = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
)
