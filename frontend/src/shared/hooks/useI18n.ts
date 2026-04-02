import { useAppStore } from '../../app/providers/store'
import { i18n } from '../config/i18n'

export const useI18n = () => {
  const { state } = useAppStore()
  return i18n[state.language]
}
