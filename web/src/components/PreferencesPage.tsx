import { usePreferencesStore, type ThemePreference } from '@/store/preferencesStore'

function CheckRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer select-none">
      <span className="text-sm text-[color:var(--c-text)]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[color:var(--c-accent)]"
      />
    </label>
  )
}

function ThemeRadio({ value, current, onChange, label, desc }: {
  value: ThemePreference
  current: ThemePreference
  onChange: (v: ThemePreference) => void
  label: string
  desc: string
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer select-none">
      <input
        type="radio"
        name="theme"
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        className="mt-1 h-4 w-4 accent-[color:var(--c-accent)]"
      />
      <div>
        <div className="text-sm text-[color:var(--c-text)]">{label}</div>
        <div className="text-xs text-[color:var(--c-muted-2)]">{desc}</div>
      </div>
    </label>
  )
}

export default function PreferencesPage({ onClose }: { onClose: () => void }) {
  const themePreference = usePreferencesStore((s) => s.themePreference)
  const showEraLegend = usePreferencesStore((s) => s.showEraLegend)
  const showEdgeLabels = usePreferencesStore((s) => s.showEdgeLabels)
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference)
  const setShowEraLegend = usePreferencesStore((s) => s.setShowEraLegend)
  const setShowEdgeLabels = usePreferencesStore((s) => s.setShowEdgeLabels)
  const resetPreferences = usePreferencesStore((s) => s.resetPreferences)

  return (
    <div className="h-screen flex flex-col bg-[color:var(--c-bg)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--c-border)] bg-[color:var(--c-panel)]">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm rounded border border-[color:var(--c-border)] bg-[color:var(--c-panel-2)] text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] transition-colors"
        >
          Back
        </button>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[color:var(--c-text)]">Preferences</div>
          <div className="text-xs text-[color:var(--c-muted-2)]">Appearance and graph settings</div>
        </div>
        <div className="ml-auto">
          <button
            onClick={resetPreferences}
            className="px-3 py-1.5 text-sm rounded border border-[color:var(--c-border)] bg-[color:var(--c-panel-2)] text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-panel)] shadow-[var(--shadow-panel)]">
            <div className="px-4 py-3 border-b border-[color:var(--c-border)]">
              <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--c-muted-2)]">Theme</div>
            </div>
            <div className="px-4">
              <ThemeRadio
                value="system"
                current={themePreference}
                onChange={setThemePreference}
                label="System"
                desc="Match your macOS appearance"
              />
              <ThemeRadio
                value="dark"
                current={themePreference}
                onChange={setThemePreference}
                label="Dark"
                desc="Best for night sessions and dense graphs"
              />
              <ThemeRadio
                value="light"
                current={themePreference}
                onChange={setThemePreference}
                label="Light"
                desc="Crisp, print-like look"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-panel)] shadow-[var(--shadow-panel)]">
            <div className="px-4 py-3 border-b border-[color:var(--c-border)]">
              <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--c-muted-2)]">Graph</div>
            </div>
            <div className="px-4">
              <CheckRow checked={showEraLegend} label="Show era legend overlay" onChange={setShowEraLegend} />
              <div className="border-t border-[color:var(--c-border)]" />
              <CheckRow checked={showEdgeLabels} label="Show edge labels (Network view)" onChange={setShowEdgeLabels} />
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-panel)] shadow-[var(--shadow-panel)]">
            <div className="px-4 py-3 border-b border-[color:var(--c-border)]">
              <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--c-muted-2)]">About</div>
            </div>
            <div className="px-4 py-3 text-sm text-[color:var(--c-muted)]">
              Preferences are saved locally in your browser.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

