import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'system' | 'light' | 'dark'

interface PreferencesState {
  themePreference: ThemePreference
  showEraLegend: boolean
  showEdgeLabels: boolean

  setThemePreference: (t: ThemePreference) => void
  setShowEraLegend: (v: boolean) => void
  setShowEdgeLabels: (v: boolean) => void
  resetPreferences: () => void
}

const DEFAULTS: Pick<PreferencesState, 'themePreference' | 'showEraLegend' | 'showEdgeLabels'> = {
  themePreference: 'system',
  showEraLegend: true,
  showEdgeLabels: true,
}

export const PREFERENCES_STORAGE_KEY = 'violetta.preferences.v1'

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setThemePreference: (t) => set({ themePreference: t }),
      setShowEraLegend: (v) => set({ showEraLegend: v }),
      setShowEdgeLabels: (v) => set({ showEdgeLabels: v }),

      resetPreferences: () => set({ ...DEFAULTS }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      version: 1,
    },
  ),
)

