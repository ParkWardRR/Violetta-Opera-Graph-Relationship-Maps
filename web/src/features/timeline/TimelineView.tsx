import { useState, useMemo, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { OrthographicView } from '@deck.gl/core'
import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers'
import { useGraphStore } from '@/store/graphStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useFilterStore } from '@/store/filterStore'
import { ERA_COLORS } from '@/types/graph'
import type { ResolvedTheme } from '@/lib/theme'

type ViewMode = 'scatter' | 'decades'

function hexToRGB(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, 255]
}

function hexToRGBA(hex: string, alpha: number): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, alpha]
}

// Deterministic hash for stable jitter
function stableHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export default function TimelineView({ resolvedTheme }: { resolvedTheme: ResolvedTheme }) {
  const rawData = useGraphStore((s) => s.rawData)
  const selectedNodeKeys = useSelectionStore((s) => s.selectedNodeKeys)
  const { setSelected } = useSelectionStore()
  const { composerFilter, eraFilter, decadeRange, searchQuery } = useFilterStore()
  const [viewMode, setViewMode] = useState<ViewMode>('scatter')

  const operaNodes = useMemo(() => {
    if (!rawData) return []
    return rawData.nodes
      .filter((n) => n.attributes.type === 'opera' && n.attributes.premiereYear)
      .filter((n) => {
        const a = n.attributes
        if (composerFilter.length > 0 && a.composerId && !composerFilter.includes(a.composerId)) return false
        if (eraFilter.length > 0 && a.eraBucket && !eraFilter.includes(a.eraBucket)) return false
        if (a.premiereYear && (a.premiereYear < decadeRange[0] || a.premiereYear > decadeRange[1])) return false
        if (searchQuery && !a.label.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
  }, [rawData, composerFilter, eraFilter, decadeRange, searchQuery])

  // Pre-compute stable positions so ScatterplotLayer and LineLayer share the same coords
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number]>()
    for (const node of operaNodes) {
      const year = node.attributes.premiereYear ?? 1800
      const h = stableHash(node.key)
      if (viewMode === 'decades') {
        const decade = Math.floor(year / 10) * 10
        const jitter = ((h % 1000) / 1000 - 0.5) * 6
        positions.set(node.key, [decade, (node.attributes.projY ?? (h % 20)) + jitter])
      } else {
        positions.set(node.key, [year, node.attributes.projY ?? ((h % 20) - 10)])
      }
    }
    return positions
  }, [operaNodes, viewMode])

  // Edges between visible opera nodes -- these become the connecting lines
  const operaEdges = useMemo(() => {
    if (!rawData) return []
    const visibleKeys = new Set(operaNodes.map((n) => n.key))
    return rawData.edges.filter(
      (e) =>
        visibleKeys.has(e.source) &&
        visibleKeys.has(e.target) &&
        nodePositions.has(e.source) &&
        nodePositions.has(e.target),
    )
  }, [rawData, operaNodes, nodePositions])

  const onClick = useCallback(
    (info: { object?: (typeof operaNodes)[0] }) => {
      if (info.object) {
        setSelected(new Set([info.object.key]), 'timeline')
      } else {
        useSelectionStore.getState().clearSelection()
      }
    },
    [setSelected],
  )

  // Era boundary markers
  const eraMarkers = useMemo(
    () => [
      { year: 1600, label: 'Baroque', color: ERA_COLORS['Baroque'] },
      { year: 1750, label: 'Classical', color: ERA_COLORS['Classical'] },
      { year: 1820, label: 'Early Romantic', color: ERA_COLORS['Early Romantic'] },
      { year: 1850, label: 'Late Romantic', color: ERA_COLORS['Late Romantic'] },
      { year: 1910, label: '20th Century', color: ERA_COLORS['20th Century'] },
      { year: 1975, label: 'Contemporary', color: ERA_COLORS['Contemporary'] },
    ],
    [],
  )

  // Year axis ticks
  const yearTicks = useMemo(() => {
    const ticks = []
    for (let year = 1600; year <= 2030; year += 50) {
      ticks.push({ year, label: String(year) })
    }
    return ticks
  }, [])

  const isDark = resolvedTheme === 'dark'

  // --- Layers ---

  // 1. Connecting lines between related operas
  const lineLayer = new LineLayer({
    id: 'opera-connections',
    data: operaEdges,
    getSourcePosition: (d: (typeof operaEdges)[0]) => nodePositions.get(d.source) ?? [0, 0],
    getTargetPosition: (d: (typeof operaEdges)[0]) => nodePositions.get(d.target) ?? [0, 0],
    getColor: (d: (typeof operaEdges)[0]) => {
      if (selectedNodeKeys.size > 0) {
        if (selectedNodeKeys.has(d.source) || selectedNodeKeys.has(d.target)) {
          return isDark ? [100, 149, 237, 160] : [59, 130, 246, 140]
        }
        return [30, 30, 30, 15]
      }
      switch (d.attributes.type) {
        case 'similar_to':
          return isDark ? [100, 149, 237, 50] : [59, 130, 246, 40]
        case 'composed_by':
          return isDark ? [148, 163, 184, 30] : [100, 116, 139, 25]
        default:
          return isDark ? [100, 100, 100, 20] : [80, 80, 80, 15]
      }
    },
    getWidth: (d: (typeof operaEdges)[0]) => {
      if (selectedNodeKeys.size > 0 && (selectedNodeKeys.has(d.source) || selectedNodeKeys.has(d.target))) {
        return 2
      }
      return 1
    },
    updateTriggers: {
      getColor: [selectedNodeKeys, isDark],
      getWidth: [selectedNodeKeys],
      getSourcePosition: [nodePositions],
      getTargetPosition: [nodePositions],
    },
    widthMinPixels: 1,
    widthMaxPixels: 3,
  })

  // 2. Opera dots
  const scatterLayer = new ScatterplotLayer({
    id: 'opera-scatter',
    data: operaNodes,
    getPosition: ((d: (typeof operaNodes)[0]) => nodePositions.get(d.key) ?? [0, 0]) as (d: unknown) => [number, number],
    getRadius: (d: (typeof operaNodes)[0]) =>
      selectedNodeKeys.size > 0 && selectedNodeKeys.has(d.key) ? 5 : 2.5,
    getFillColor: (d: (typeof operaNodes)[0]) => {
      if (selectedNodeKeys.size > 0 && !selectedNodeKeys.has(d.key)) {
        return isDark ? [50, 50, 50, 80] : [160, 160, 160, 80]
      }
      return hexToRGB(d.attributes.color || ERA_COLORS[d.attributes.eraBucket ?? ''] || '#999')
    },
    pickable: true,
    onClick,
    updateTriggers: {
      getRadius: [selectedNodeKeys],
      getFillColor: [selectedNodeKeys, isDark],
      getPosition: [nodePositions],
    },
    radiusMinPixels: 4,
    radiusMaxPixels: 16,
  })

  // 3. Era boundary labels
  const eraLabelLayer = new TextLayer({
    id: 'era-labels',
    data: eraMarkers,
    getPosition: (d: (typeof eraMarkers)[0]) => [d.year, -18] as [number, number],
    getText: (d: (typeof eraMarkers)[0]) => d.label,
    getColor: (d: (typeof eraMarkers)[0]) => hexToRGBA(d.color, 200),
    getSize: 11,
    getAngle: 0,
    getTextAnchor: 'start' as const,
    getAlignmentBaseline: 'top' as const,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: 600,
  })

  // 4. Year tick labels
  const yearLabelLayer = new TextLayer({
    id: 'year-labels',
    data: yearTicks,
    getPosition: (d: (typeof yearTicks)[0]) => [d.year, -15] as [number, number],
    getText: (d: (typeof yearTicks)[0]) => d.label,
    getColor: isDark ? [148, 163, 184, 150] : [71, 85, 105, 150],
    getSize: 9,
    getAngle: 0,
    getTextAnchor: 'middle' as const,
    getAlignmentBaseline: 'top' as const,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  })

  // Zoomed in: center on the Late Romantic golden age
  const INITIAL_VIEW_STATE = {
    target: [1850, 0] as [number, number],
    zoom: 3,
  }

  const palette = isDark
    ? { bg: '#0b1220', tooltipBg: '#111827', tooltipText: '#e2e8f0', tooltipBorder: 'rgba(255,255,255,0.1)' }
    : { bg: '#f8fafc', tooltipBg: '#ffffff', tooltipText: '#0f172a', tooltipBorder: '#e2e8f0' }

  return (
    <div className="relative h-full w-full" data-testid="timeline-view">
      {/* View mode toggle */}
      <div className="absolute top-3 right-3 z-10 flex gap-1 p-1 rounded-lg bg-[color:var(--c-panel)]/80 backdrop-blur-sm border border-[color:var(--c-border)]">
        <button
          className={`px-3 py-1 text-xs rounded-md transition-all duration-150 ${
            viewMode === 'scatter'
              ? 'bg-[color:var(--c-accent)] text-white shadow-sm'
              : 'text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] hover:bg-white/5'
          }`}
          onClick={() => setViewMode('scatter')}
        >
          Scatter
        </button>
        <button
          className={`px-3 py-1 text-xs rounded-md transition-all duration-150 ${
            viewMode === 'decades'
              ? 'bg-[color:var(--c-accent)] text-white shadow-sm'
              : 'text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] hover:bg-white/5'
          }`}
          onClick={() => setViewMode('decades')}
        >
          Decades
        </button>
      </div>

      {/* Navigation hint */}
      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-[color:var(--c-muted-2)] bg-[color:var(--c-panel)]/60 backdrop-blur-sm px-2 py-1 rounded">
        Scroll to zoom &middot; Drag to pan &middot; Click a dot for details
      </div>

      {/* Connection stats */}
      {operaEdges.length > 0 && (
        <div className="absolute top-3 left-3 z-10 text-[10px] text-[color:var(--c-muted-2)] bg-[color:var(--c-panel)]/60 backdrop-blur-sm px-2 py-1 rounded">
          {operaEdges.length} connections
        </div>
      )}

      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[lineLayer, scatterLayer, eraLabelLayer, yearLabelLayer]}
        views={new OrthographicView({ id: 'ortho' })}
        style={{ background: palette.bg }}
        getTooltip={({ object }: { object?: (typeof operaNodes)[0] }) => {
          if (!object) return null
          const a = object.attributes
          return {
            text: `${a.label}\n${a.composerName ?? 'Unknown'} (${a.premiereYear ?? '?'})\n${a.eraBucket ?? ''}`,
            style: {
              backgroundColor: palette.tooltipBg,
              color: palette.tooltipText,
              fontSize: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${palette.tooltipBorder}`,
              boxShadow: 'var(--shadow-panel)',
              lineHeight: '1.5',
            },
          }
        }}
      />
    </div>
  )
}
