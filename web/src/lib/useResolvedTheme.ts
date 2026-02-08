import { useEffect, useMemo, useState } from 'react'
import { usePreferencesStore } from '@/store/preferencesStore'
import { applyResolvedTheme, getSystemTheme, resolveTheme, type ResolvedTheme } from '@/lib/theme'

export function useResolvedTheme(): { resolvedTheme: ResolvedTheme } {
  const pref = usePreferencesStore((s) => s.themePreference)

  const initial = useMemo(() => resolveTheme(pref), [pref])
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(initial)

  useEffect(() => {
    if (pref !== 'system') {
      setResolvedTheme(pref)
      applyResolvedTheme(pref)
      return
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      const t = getSystemTheme()
      setResolvedTheme(t)
      applyResolvedTheme(t)
    }
    sync()

    // Safari uses addListener/removeListener.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyMq = mq as any
    if (anyMq.addEventListener) {
      mq.addEventListener('change', sync)
      return () => mq.removeEventListener('change', sync)
    }
    mq.addListener(sync)
    return () => mq.removeListener(sync)
  }, [pref])

  return { resolvedTheme }
}

