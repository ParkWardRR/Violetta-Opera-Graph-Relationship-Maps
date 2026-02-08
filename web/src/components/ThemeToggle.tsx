import { usePreferencesStore } from '@/store/preferencesStore'
import type { ResolvedTheme } from '@/lib/theme'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-14a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm8-8a1 1 0 0 1 1 1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-2 0 1 1 0 0 1 1-1Zm-18 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1H1a1 1 0 1 1 0-2h1Zm14.95-6.95a1 1 0 0 1 0 1.41l-.7.7a1 1 0 1 1-1.41-1.41l.7-.7a1 1 0 0 1 1.41 0Zm-9.9 9.9a1 1 0 0 1 0 1.41l-.7.7a1 1 0 1 1-1.41-1.41l.7-.7a1 1 0 0 1 1.41 0Zm9.2 2.11a1 1 0 0 1 1.41 0l.7.7a1 1 0 1 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41ZM6.34 5.05a1 1 0 0 1 1.41 0l.7.7a1 1 0 0 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41Z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.1 22a9.7 9.7 0 0 1-9.7-9.7c0-4.9 3.6-9 8.4-9.6 1-.1 1.5 1.2.7 1.9a7 7 0 0 0-2.1 5c0 3.9 3.2 7.1 7.1 7.1.9 0 1.8-.2 2.6-.5 1-.4 1.9.6 1.3 1.5A9.7 9.7 0 0 1 12.1 22Z"
      />
    </svg>
  )
}

export default function ThemeToggle({ resolvedTheme }: { resolvedTheme: ResolvedTheme }) {
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference)

  const next = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <button
      onClick={() => setThemePreference(next)}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded border border-[color:var(--c-border)] bg-[color:var(--c-panel-2)] text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] transition-colors"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
      <span className="hidden sm:inline">{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
