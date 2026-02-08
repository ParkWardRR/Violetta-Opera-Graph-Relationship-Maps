import { useMemo, useState, useRef, useEffect } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { useGraphStore } from '@/store/graphStore'
import { ERA_COLORS } from '@/types/graph'

const ERAS = ['Baroque', 'Classical', 'Early Romantic', 'Late Romantic', '20th Century', 'Contemporary']

export default function FilterBar() {
  const rawData = useGraphStore((s) => s.rawData)
  const {
    composerFilter, setComposerFilter,
    eraFilter, setEraFilter,
    decadeRange, setDecadeRange,
    searchQuery, setSearchQuery,
    resetFilters,
  } = useFilterStore()

  const composers = useMemo(() => {
    if (!rawData) return []
    return rawData.nodes
      .filter((n) => n.attributes.type === 'composer')
      .sort((a, b) => a.attributes.label.localeCompare(b.attributes.label))
  }, [rawData])

  const [composerDropdownOpen, setComposerDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setComposerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleComposer = (id: string) => {
    if (composerFilter.includes(id)) {
      setComposerFilter(composerFilter.filter((c) => c !== id))
    } else {
      setComposerFilter([...composerFilter, id])
    }
  }

  const toggleEra = (era: string) => {
    if (eraFilter.includes(era)) {
      setEraFilter(eraFilter.filter((e) => e !== era))
    } else {
      setEraFilter([...eraFilter, era])
    }
  }

  const operaCount = useMemo(() => rawData?.nodes.filter((n) => n.attributes.type === 'opera').length ?? 0, [rawData])
  const composerCount = useMemo(() => rawData?.nodes.filter((n) => n.attributes.type === 'composer').length ?? 0, [rawData])

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[color:var(--c-panel)] border-b border-[color:var(--c-border)] overflow-x-auto">
      {/* Search */}
      <input
        type="text"
        placeholder="Search operas..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-[color:var(--c-panel-2)] text-[color:var(--c-text)] placeholder:text-[color:var(--c-muted-2)] text-sm px-3 py-1.5 rounded border border-[color:var(--c-border)] focus:border-[color:var(--c-accent)] focus:outline-none w-48"
      />

      {/* Composer multi-select */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setComposerDropdownOpen(!composerDropdownOpen)}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            composerFilter.length > 0
              ? 'border-[color:var(--c-accent)] text-[color:var(--c-text)] bg-[color:var(--c-panel-2)]'
              : 'border-[color:var(--c-border)] text-[color:var(--c-muted)] hover:text-[color:var(--c-text)]'
          }`}
        >
          Composers{composerFilter.length > 0 ? ` (${composerFilter.length})` : ''}
        </button>
        {composerDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] rounded shadow-[var(--shadow-panel)] z-50 max-h-64 overflow-y-auto w-56">
            {composers.map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[color:var(--c-text)] hover:bg-[color:var(--c-panel-2)] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={composerFilter.includes(c.key)}
                  onChange={() => toggleComposer(c.key)}
                  className="accent-[color:var(--c-accent)]"
                />
                {c.attributes.label}
              </label>
            ))}
            {composerFilter.length > 0 && (
              <button
                onClick={() => setComposerFilter([])}
                className="w-full px-3 py-1.5 text-xs text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] border-t border-[color:var(--c-border)]"
              >
                Clear composers
              </button>
            )}
          </div>
        )}
      </div>

      {/* Era filter chips */}
      <div className="flex gap-1 flex-shrink-0">
        {ERAS.map((era) => (
          <button
            key={era}
            onClick={() => toggleEra(era)}
            className={`px-2 py-1 text-xs rounded-full border transition-colors ${
              eraFilter.includes(era)
                ? 'border-transparent text-white'
                : 'border-[color:var(--c-border)] text-[color:var(--c-muted)] hover:text-[color:var(--c-text)]'
            }`}
            style={eraFilter.includes(era) ? { backgroundColor: ERA_COLORS[era] } : {}}
          >
            {era}
          </button>
        ))}
      </div>

      {/* Decade range */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-[color:var(--c-muted)]">{decadeRange[0]}</span>
        <input
          type="range"
          min={1600}
          max={2030}
          step={10}
          value={decadeRange[0]}
          onChange={(e) => setDecadeRange([parseInt(e.target.value), decadeRange[1]])}
          className="w-20"
        />
        <input
          type="range"
          min={1600}
          max={2030}
          step={10}
          value={decadeRange[1]}
          onChange={(e) => setDecadeRange([decadeRange[0], parseInt(e.target.value)])}
          className="w-20"
        />
        <span className="text-xs text-[color:var(--c-muted)]">{decadeRange[1]}</span>
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="px-2 py-1 text-xs text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] border border-[color:var(--c-border)] rounded bg-[color:var(--c-panel-2)]"
      >
        Reset
      </button>

      {/* Stats */}
      <div className="ml-auto text-xs text-[color:var(--c-muted-2)] flex-shrink-0">
        {operaCount} operas, {composerCount} composers
      </div>
    </div>
  )
}
