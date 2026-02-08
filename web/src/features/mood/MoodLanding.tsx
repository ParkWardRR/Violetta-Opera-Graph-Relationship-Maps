import { useState, useMemo, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { OrthographicView } from '@deck.gl/core'
import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers'
import { useGraphStore } from '@/store/graphStore'
import { useSelectionStore } from '@/store/selectionStore'
import { MOODS, MOOD_MAP, buildMoodGraph } from '@/data/moods'
import type { MoodNode, MoodEdge } from '@/data/moods'
import type { ResolvedTheme } from '@/lib/theme'

export default function MoodLanding({ resolvedTheme }: { resolvedTheme: ResolvedTheme }) {
  const rawData = useGraphStore((s) => s.rawData)
  const selectedNodeKeys = useSelectionStore((s) => s.selectedNodeKeys)
  const { setSelected } = useSelectionStore()
  const [activeMood, setActiveMood] = useState<string | null>(null)

  const { moodNodes, moodEdges } = useMemo(() => {
    if (!rawData) return { moodNodes: [], moodEdges: [] }
    return buildMoodGraph(rawData.nodes)
  }, [rawData])

  const posMap = useMemo(() => {
    const m = new Map<string, [number, number]>()
    for (const n of moodNodes) m.set(n.key, [n.x, n.y])
    return m
  }, [moodNodes])

  const filteredNodes = useMemo(() => {
    if (!activeMood) return moodNodes
    return moodNodes.filter((n) => n.moods.includes(activeMood))
  }, [moodNodes, activeMood])

  const filteredEdges = useMemo(() => {
    if (!activeMood) return moodEdges
    const keys = new Set(filteredNodes.map((n) => n.key))
    return moodEdges.filter((e) => keys.has(e.source) && keys.has(e.target))
  }, [moodEdges, filteredNodes, activeMood])

  const moodCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of moodNodes) {
      for (const m of n.moods) {
        counts.set(m, (counts.get(m) || 0) + 1)
      }
    }
    return counts
  }, [moodNodes])

  const onClick = useCallback(
    (info: { object?: MoodNode }) => {
      if (info.object) {
        setSelected(new Set([info.object.key]), 'timeline')
      } else {
        useSelectionStore.getState().clearSelection()
      }
    },
    [setSelected],
  )

  const isDark = resolvedTheme === 'dark'

  const lineLayer = new LineLayer<MoodEdge>({
    id: 'mood-connections',
    data: filteredEdges,
    getSourcePosition: (d) => posMap.get(d.source) ?? [0, 0],
    getTargetPosition: (d) => posMap.get(d.target) ?? [0, 0],
    getColor: (d) => {
      const mood = MOOD_MAP.get(d.sharedMood)
      if (!mood) return [100, 100, 100, 30]
      if (selectedNodeKeys.size > 0) {
        if (selectedNodeKeys.has(d.source) || selectedNodeKeys.has(d.target)) {
          return [...mood.colorRGB, 180] as [number, number, number, number]
        }
        return isDark ? [30, 30, 30, 10] : [200, 200, 200, 20]
      }
      return [...mood.colorRGB, isDark ? 35 : 25] as [number, number, number, number]
    },
    getWidth: (d) => {
      if (selectedNodeKeys.size > 0 && (selectedNodeKeys.has(d.source) || selectedNodeKeys.has(d.target))) {
        return 2.5
      }
      return 1
    },
    updateTriggers: {
      getColor: [selectedNodeKeys, isDark],
      getWidth: [selectedNodeKeys],
      getSourcePosition: [posMap],
      getTargetPosition: [posMap],
    },
    widthMinPixels: 1,
    widthMaxPixels: 4,
  })

  const scatterLayer = new ScatterplotLayer<MoodNode>({
    id: 'mood-scatter',
    data: filteredNodes,
    getPosition: (d) => [d.x, d.y] as [number, number],
    getRadius: (d) =>
      selectedNodeKeys.size > 0 && selectedNodeKeys.has(d.key) ? 0.6 : 0.35,
    getFillColor: (d) => {
      const mood = MOOD_MAP.get(d.primaryMood)
      if (!mood) return [150, 150, 150, 255]
      if (selectedNodeKeys.size > 0 && !selectedNodeKeys.has(d.key)) {
        return isDark ? [40, 40, 50, 100] : [180, 180, 190, 100]
      }
      return [...mood.colorRGB, 230] as [number, number, number, number]
    },
    pickable: true,
    onClick,
    updateTriggers: {
      getRadius: [selectedNodeKeys],
      getFillColor: [selectedNodeKeys, isDark],
    },
    radiusMinPixels: 6,
    radiusMaxPixels: 20,
    stroked: true,
    getLineColor: (d) => {
      const mood = MOOD_MAP.get(d.primaryMood)
      if (!mood) return [255, 255, 255, 40]
      if (selectedNodeKeys.size > 0 && selectedNodeKeys.has(d.key)) {
        return [255, 255, 255, 200]
      }
      return [...mood.colorRGB, 60] as [number, number, number, number]
    },
    lineWidthMinPixels: 1,
  })

  const clusterLabels = useMemo(
    () =>
      MOODS.map((m) => ({
        ...m,
        cx: Math.cos(m.angle) * 12,
        cy: Math.sin(m.angle) * 12,
      })),
    [],
  )

  const labelLayer = new TextLayer({
    id: 'mood-labels',
    data: clusterLabels,
    getPosition: (d: (typeof clusterLabels)[0]) => [d.cx, d.cy - 7.5] as [number, number],
    getText: (d: (typeof clusterLabels)[0]) => d.label,
    getColor: (d: (typeof clusterLabels)[0]) => [...d.colorRGB, isDark ? 200 : 180] as [number, number, number, number],
    getSize: 13,
    getTextAnchor: 'middle' as const,
    getAlignmentBaseline: 'bottom' as const,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: 700,
    updateTriggers: { getColor: [isDark] },
  })

  const taglineLayer = new TextLayer({
    id: 'mood-taglines',
    data: clusterLabels,
    getPosition: (d: (typeof clusterLabels)[0]) => [d.cx, d.cy - 6.8] as [number, number],
    getText: (d: (typeof clusterLabels)[0]) => d.tagline,
    getColor: isDark ? [148, 163, 184, 140] : [100, 116, 139, 140],
    getSize: 9,
    getTextAnchor: 'middle' as const,
    getAlignmentBaseline: 'top' as const,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: 400,
  })

  const centerLabel = new TextLayer({
    id: 'center-title',
    data: [{ text: 'Opera\nby Mood', x: 0, y: 0 }],
    getPosition: (d: { x: number; y: number }) => [d.x, d.y] as [number, number],
    getText: (d: { text: string }) => d.text,
    getColor: isDark ? [226, 232, 240, 60] : [15, 23, 42, 40],
    getSize: 18,
    getTextAnchor: 'middle' as const,
    getAlignmentBaseline: 'center' as const,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: 800,
  })

  const INITIAL_VIEW_STATE = {
    target: [0, 0] as [number, number],
    zoom: 4.2,
  }

  const palette = isDark
    ? { bg: '#06081a', tooltipBg: '#111827', tooltipText: '#e2e8f0', tooltipBorder: 'rgba(255,255,255,0.08)' }
    : { bg: '#f8fafc', tooltipBg: '#ffffff', tooltipText: '#0f172a', tooltipBorder: '#e2e8f0' }

  return (
    <div className="relative h-full w-full" data-testid="mood-landing">
      {/* Mood filter pills */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 p-1.5 rounded-2xl bg-[color:var(--c-panel)]/80 backdrop-blur-md border border-[color:var(--c-border)] shadow-lg">
        <button
          className={`px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all duration-200 ${
            activeMood === null
              ? 'bg-white/10 text-[color:var(--c-text)] shadow-sm'
              : 'text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] hover:bg-white/5'
          }`}
          onClick={() => setActiveMood(null)}
        >
          All moods
        </button>
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all duration-200 ${
              activeMood === mood.id
                ? 'shadow-sm'
                : 'text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] hover:bg-white/5'
            }`}
            style={
              activeMood === mood.id
                ? { backgroundColor: mood.color + '20', color: mood.color, boxShadow: `0 0 12px ${mood.color}15` }
                : {}
            }
            onClick={() => setActiveMood(activeMood === mood.id ? null : mood.id)}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: mood.color }}
            />
            <span className="hidden md:inline">{mood.label.split(' & ')[0]}</span>
            <span className="text-[9px] opacity-60">{moodCounts.get(mood.id) || 0}</span>
          </button>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-[color:var(--c-muted-2)] bg-[color:var(--c-panel)]/60 backdrop-blur-sm px-2 py-1 rounded">
        Scroll to zoom &middot; Drag to pan &middot; Click a dot for details
      </div>

      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-[color:var(--c-muted-2)] bg-[color:var(--c-panel)]/60 backdrop-blur-sm px-2 py-1 rounded">
        {filteredNodes.length} operas &middot; {filteredEdges.length} connections
      </div>

      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[lineLayer, scatterLayer, labelLayer, taglineLayer, centerLabel]}
        views={new OrthographicView({ id: 'ortho' })}
        style={{ background: palette.bg }}
        getTooltip={({ object }: { object?: MoodNode }) => {
          if (!object) return null
          const moodLabels = object.moods
            .map((m) => MOOD_MAP.get(m)?.label ?? m)
            .join(', ')
          return {
            text: `${object.label}\n${object.composerName}${object.premiereYear ? ` (${object.premiereYear})` : ''}\n${moodLabels}`,
            style: {
              backgroundColor: palette.tooltipBg,
              color: palette.tooltipText,
              fontSize: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${palette.tooltipBorder}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              lineHeight: '1.6',
            },
          }
        }}
      />
    </div>
  )
}
