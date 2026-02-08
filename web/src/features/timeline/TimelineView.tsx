import { useState, useMemo, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { OrthographicView } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import { useGraphStore } from '@/store/graphStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useFilterStore } from '@/store/filterStore'
import { ERA_COLORS } from '@/types/graph'

type ViewMode = 'scatter' | 'decades'

function hexToRGB(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, 255]
}

export default function TimelineView() {
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

  const getPosition = useCallback(
    (d: (typeof operaNodes)[0]): [number, number] => {
      const year = d.attributes.premiereYear ?? 1800
      if (viewMode === 'decades') {
        const decade = Math.floor(year / 10) * 10
        const jitter = (Math.random() - 0.5) * 6
        return [decade, (d.attributes.projY ?? Math.random() * 20) + jitter]
      }
      return [year, d.attributes.projY ?? Math.random() * 20 - 10]
    },
    [viewMode],
  )

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

  const layer = new ScatterplotLayer({
    id: 'opera-scatter',
    data: operaNodes,
    getPosition: getPosition as (d: unknown) => [number, number],
    getRadius: (d: (typeof operaNodes)[0]) =>
      selectedNodeKeys.size > 0 && selectedNodeKeys.has(d.key) ? 4 : 2,
    getFillColor: (d: (typeof operaNodes)[0]) => {
      if (selectedNodeKeys.size > 0 && !selectedNodeKeys.has(d.key)) {
        return [50, 50, 50, 100]
      }
      return hexToRGB(d.attributes.color || ERA_COLORS[d.attributes.eraBucket ?? ''] || '#999')
    },
    pickable: true,
    onClick,
    updateTriggers: {
      getRadius: [selectedNodeKeys],
      getFillColor: [selectedNodeKeys],
      getPosition: [viewMode],
    },
    radiusMinPixels: 3,
    radiusMaxPixels: 12,
  })

  const INITIAL_VIEW_STATE = {
    target: [1850, 0] as [number, number],
    zoom: 1,
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <button
          className={`px-3 py-1 text-xs rounded ${viewMode === 'scatter' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          onClick={() => setViewMode('scatter')}
        >
          Scatter
        </button>
        <button
          className={`px-3 py-1 text-xs rounded ${viewMode === 'decades' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          onClick={() => setViewMode('decades')}
        >
          Decades
        </button>
      </div>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[layer]}
        views={new OrthographicView({ id: 'ortho' })}
        style={{ background: '#0f172a' }}
        getTooltip={({ object }: { object?: (typeof operaNodes)[0] }) => {
          if (!object) return null
          const a = object.attributes
          return {
            text: `${a.label}\n${a.composerName ?? ''} (${a.premiereYear ?? '?'})\n${a.eraBucket ?? ''}`,
            style: {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              fontSize: '12px',
              padding: '8px',
              borderRadius: '4px',
            },
          }
        }}
      />
    </div>
  )
}
