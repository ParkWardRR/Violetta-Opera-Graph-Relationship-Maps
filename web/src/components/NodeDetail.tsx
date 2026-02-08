import { useMemo } from 'react'
import { useSelectionStore } from '@/store/selectionStore'
import { useGraphStore } from '@/store/graphStore'
import { ERA_COLORS } from '@/types/graph'

export default function NodeDetail() {
  const selectedNodeKeys = useSelectionStore((s) => s.selectedNodeKeys)
  const hoveredNodeKey = useSelectionStore((s) => s.hoveredNodeKey)
  const rawData = useGraphStore((s) => s.rawData)

  const nodeKey = hoveredNodeKey || (selectedNodeKeys.size === 1 ? [...selectedNodeKeys][0] : null)

  const node = useMemo(() => {
    if (!nodeKey || !rawData) return null
    return rawData.nodes.find((n) => n.key === nodeKey)
  }, [nodeKey, rawData])

  if (!node) return null

  const a = node.attributes
  const eraColor = a.eraBucket ? ERA_COLORS[a.eraBucket] : '#999'

  return (
    <div className="absolute bottom-4 left-4 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-4 w-72 z-20 shadow-xl">
      <div className="flex items-start gap-2">
        <div
          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
          style={{ backgroundColor: eraColor }}
        />
        <div>
          <h3 className="text-sm font-semibold text-white">{a.label}</h3>
          <p className="text-xs text-slate-400 capitalize">{a.type}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-xs">
        {a.composerName && (
          <div className="flex justify-between">
            <span className="text-slate-400">Composer</span>
            <span className="text-slate-200">{a.composerName}</span>
          </div>
        )}
        {a.premiereYear && (
          <div className="flex justify-between">
            <span className="text-slate-400">Premiere</span>
            <span className="text-slate-200">{a.premiereYear}</span>
          </div>
        )}
        {a.premiereLocation && (
          <div className="flex justify-between">
            <span className="text-slate-400">Location</span>
            <span className="text-slate-200 text-right max-w-[160px]">{a.premiereLocation}</span>
          </div>
        )}
        {a.language && (
          <div className="flex justify-between">
            <span className="text-slate-400">Language</span>
            <span className="text-slate-200">{a.language}</span>
          </div>
        )}
        {a.eraBucket && (
          <div className="flex justify-between">
            <span className="text-slate-400">Era</span>
            <span style={{ color: eraColor }}>{a.eraBucket}</span>
          </div>
        )}
        {a.nationality && (
          <div className="flex justify-between">
            <span className="text-slate-400">Nationality</span>
            <span className="text-slate-200">{a.nationality}</span>
          </div>
        )}
        {a.birthYear && (
          <div className="flex justify-between">
            <span className="text-slate-400">Born</span>
            <span className="text-slate-200">{a.birthYear}{a.deathYear ? ` - ${a.deathYear}` : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}
