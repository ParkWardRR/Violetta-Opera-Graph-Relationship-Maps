import type { ThemePreference } from '@/store/preferencesStore'
import { PREFERENCES_STORAGE_KEY } from '@/store/preferencesStore'

export type ResolvedTheme = 'light' | 'dark'

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? getSystemTheme() : pref
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme
}

export function readStoredThemePreference(): ThemePreference | null {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { themePreference?: ThemePreference } }
    const t = parsed?.state?.themePreference
    if (t === 'system' || t === 'light' || t === 'dark') return t
    return null
  } catch {
    return null
  }
}

// Best-effort: run before React mounts to avoid a theme flash.
export function initThemeFromStorage() {
  if (typeof window === 'undefined') return
  const pref = readStoredThemePreference() ?? 'system'
  applyResolvedTheme(resolveTheme(pref))
}

