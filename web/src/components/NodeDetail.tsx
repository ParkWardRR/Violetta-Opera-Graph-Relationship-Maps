import { useMemo } from 'react'
import { useSelectionStore } from '@/store/selectionStore'
import { useGraphStore } from '@/store/graphStore'
import { ERA_COLORS, ERA_RANGES, ERA_ORDER } from '@/types/graph'
import type { GraphNode } from '@/types/graph'

function formatEdgeType(t: string): string {
  return t.replace(/_/g, ' ')
}

const ERA_CONTEXT: Record<string, string> = {
  'Baroque': 'This is a Baroque opera -- the earliest era of opera, when the art form was born in Italian courts. Expect harpsichords, ornate vocal lines, and mythological stories.',
  'Classical': 'This is a Classical-era opera -- the age of Mozart, with cleaner melodies, comic plots, and the rise of the modern orchestra.',
  'Early Romantic': 'This is an Early Romantic opera -- the bel canto era, where beautiful singing reigned supreme. Big emotions, virtuosic arias, and dramatic love stories.',
  'Late Romantic': "This is a Late Romantic opera -- the golden age of Verdi and Wagner. Grand orchestras, powerful emotions, and some of the most famous music ever written.",
  '20th Century': 'This is a 20th-century opera -- an era when composers broke every rule. Atonality, chamber operas, and bold experiments pushed the art form forward.',
  'Contemporary': 'This is a contemporary opera -- proof that the art form is alive and evolving. Minimalism, electronics, and stories that reflect our modern world.',
}

function WelcomeState({ operaCount, composerCount }: { operaCount: number; composerCount: number }) {
  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--c-text)] mb-1">Violetta Opera Graph</h2>
        <p className="text-xs text-[color:var(--c-muted)] leading-relaxed">
          Explore how operas connect to their composers, to each other, and across centuries of music history.
          Every dot is a real opera or composer pulled from Wikidata, MusicBrainz, and Open Opus.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-[color:var(--c-text)]">{operaCount}</div>
          <div className="text-[10px] text-[color:var(--c-muted)] uppercase tracking-wider">Operas</div>
        </div>
        <div className="bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-[color:var(--c-text)]">{composerCount}</div>
          <div className="text-[10px] text-[color:var(--c-muted)] uppercase tracking-wider">Composers</div>
        </div>
      </div>

      <div className="bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] rounded-lg p-3 text-center">
        <div className="text-sm font-semibold text-[color:var(--c-text)]">400+ years of opera</div>
        <div className="text-[10px] text-[color:var(--c-muted)]">from Baroque to Contemporary</div>
      </div>

      <div>
        <div className="text-[10px] font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider mb-2">How to explore</div>
        <div className="space-y-2 text-xs text-[color:var(--c-muted)]">
          <div className="flex gap-2">
            <span className="text-[color:var(--c-muted-2)] flex-shrink-0">Click</span>
            <span>any node to see its details and connections</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[color:var(--c-muted-2)] flex-shrink-0">Hover</span>
            <span>to preview opera or composer info</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[color:var(--c-muted-2)] flex-shrink-0">Filter</span>
            <span>by era, composer, decade, or search by name</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[color:var(--c-muted-2)] flex-shrink-0">Switch</span>
            <span>between Network and Timeline views</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider mb-2">Era colors</div>
        <div className="space-y-1.5">
          {ERA_ORDER.map((era) => (
            <div key={era} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: ERA_COLORS[era] }}
              />
              <span className="text-[11px] text-[color:var(--c-text)]">{era}</span>
              <span className="text-[10px] text-[color:var(--c-muted-2)] ml-auto">{ERA_RANGES[era]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NodeInfo({ node, relatedNodes, connections }: {
  node: GraphNode
  relatedNodes: GraphNode[]
  connections: { node: GraphNode; edgeType: string }[]
}) {
  const a = node.attributes
  const eraColor = a.eraBucket ? ERA_COLORS[a.eraBucket] : '#6c757d'
  const isOpera = a.type === 'opera'
  const { setSelected } = useSelectionStore()

  const handleNodeClick = (key: string) => {
    setSelected(new Set([key]), 'filter')
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div
          className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0"
          style={{ backgroundColor: eraColor }}
        />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[color:var(--c-text)] leading-tight">{a.label}</h2>
          <p className="text-[11px] text-[color:var(--c-muted)] capitalize mt-0.5">{a.type}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-1.5 text-xs">
        {a.composerName && (
          <div className="flex justify-between gap-2">
            <span className="text-[color:var(--c-muted-2)]">Composer</span>
            <span className="text-[color:var(--c-text)] text-right">{a.composerName}</span>
          </div>
        )}
        {a.premiereYear && (
          <div className="flex justify-between gap-2">
            <span className="text-[color:var(--c-muted-2)]">Premiered</span>
            <span className="text-[color:var(--c-text)]">
              {a.premiereYear}{a.premiereLocation ? `, ${a.premiereLocation}` : ''}
            </span>
          </div>
        )}
        {a.language && (
          <div className="flex justify-between gap-2">
            <span className="text-[color:var(--c-muted-2)]">Language</span>
            <span className="text-[color:var(--c-text)]">{a.language}</span>
          </div>
        )}
        {a.genre && (
          <div className="flex justify-between gap-2">
            <span className="text-[color:var(--c-muted-2)]">Genre</span>
            <span className="text-[color:var(--c-text)]">{a.genre}</span>
          </div>
        )}
        {a.eraBucket && (
          <div className="flex justify-between gap-2">
            <span className="text-[color:var(--c-muted-2)]">Era</span>
            <span style={{ color: eraColor }}>{a.eraBucket}</span>
          </div>
        )}
        {a.nationality && (
          <div className="flex justify-between gap-2">
            <span className="text-[color:var(--c-muted-2)]">Nationality</span>
            <span className="text-[color:var(--c-text)]">{a.nationality}</span>
          </div>
        )}
        {a.birthYear && (
          <div className="flex justify-between gap-2">
            <span className="text-[color:var(--c-muted-2)]">Lived</span>
            <span className="text-[color:var(--c-text)]">{a.birthYear}{a.deathYear ? ` \u2013 ${a.deathYear}` : ' \u2013 present'}</span>
          </div>
        )}
      </div>

      {/* Era context (for newcomers) */}
      {isOpera && a.eraBucket && ERA_CONTEXT[a.eraBucket] && (
        <div className="p-2.5 rounded-lg bg-[color:var(--c-panel-2)] border-l-2" style={{ borderLeftColor: eraColor }}>
          <p className="text-[10px] text-[color:var(--c-muted)] leading-relaxed">{ERA_CONTEXT[a.eraBucket]}</p>
        </div>
      )}

      {/* Connections */}
      {connections.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider mb-2">
            Connections ({connections.length})
          </div>
          <div className="space-y-0.5">
            {connections.map((c) => (
              <button
                key={c.node.key}
                onClick={() => handleNodeClick(c.node.key)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[color:var(--c-panel-2)] transition-colors group"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.node.attributes.eraBucket ? ERA_COLORS[c.node.attributes.eraBucket] : '#6c757d' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[color:var(--c-text)] truncate group-hover:text-[color:var(--c-text)]">{c.node.attributes.label}</div>
                  <div className="text-[10px] text-[color:var(--c-muted-2)]">{formatEdgeType(c.edgeType)}</div>
                </div>
                {c.node.attributes.premiereYear && (
                  <span className="text-[10px] text-[color:var(--c-muted-2)] flex-shrink-0">{c.node.attributes.premiereYear}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related operas by same composer (for opera nodes) */}
      {isOpera && relatedNodes.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider mb-2">
            Also by {a.composerName || 'this composer'}
          </div>
          <div className="space-y-0.5">
            {relatedNodes.map((r) => (
              <button
                key={r.key}
                onClick={() => handleNodeClick(r.key)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[color:var(--c-panel-2)] transition-colors group"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: r.attributes.eraBucket ? ERA_COLORS[r.attributes.eraBucket] : '#999' }}
                />
                <span className="text-xs text-[color:var(--c-text)] truncate">{r.attributes.label}</span>
                {r.attributes.premiereYear && (
                  <span className="text-[10px] text-[color:var(--c-muted-2)] ml-auto flex-shrink-0">{r.attributes.premiereYear}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operas list (for composer nodes) */}
      {!isOpera && relatedNodes.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider mb-2">
            Operas ({relatedNodes.length})
          </div>
          <div className="space-y-0.5">
            {relatedNodes.map((r) => (
              <button
                key={r.key}
                onClick={() => handleNodeClick(r.key)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[color:var(--c-panel-2)] transition-colors group"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: r.attributes.eraBucket ? ERA_COLORS[r.attributes.eraBucket] : '#999' }}
                />
                <span className="text-xs text-[color:var(--c-text)] truncate">{r.attributes.label}</span>
                {r.attributes.premiereYear && (
                  <span className="text-[10px] text-[color:var(--c-muted-2)] ml-auto flex-shrink-0">{r.attributes.premiereYear}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NodeDetail() {
  const selectedNodeKeys = useSelectionStore((s) => s.selectedNodeKeys)
  const hoveredNodeKey = useSelectionStore((s) => s.hoveredNodeKey)
  const rawData = useGraphStore((s) => s.rawData)

  const nodeKey = hoveredNodeKey || (selectedNodeKeys.size === 1 ? [...selectedNodeKeys][0] : null)

  const node = useMemo(() => {
    if (!nodeKey || !rawData) return null
    return rawData.nodes.find((n) => n.key === nodeKey) ?? null
  }, [nodeKey, rawData])

  const { relatedNodes, connections } = useMemo(() => {
    if (!node || !rawData) return { relatedNodes: [], connections: [] }

    const a = node.attributes
    const conns: { node: GraphNode; edgeType: string }[] = []

    for (const edge of rawData.edges) {
      let otherKey: string | null = null
      if (edge.source === node.key) otherKey = edge.target
      else if (edge.target === node.key) otherKey = edge.source
      if (!otherKey) continue

      const otherNode = rawData.nodes.find((n) => n.key === otherKey)
      if (otherNode) {
        conns.push({ node: otherNode, edgeType: edge.attributes.type })
      }
    }

    let related: GraphNode[] = []
    if (a.type === 'opera' && a.composerId) {
      related = rawData.nodes.filter(
        (n) => n.key !== node.key && n.attributes.type === 'opera' && n.attributes.composerId === a.composerId
      ).sort((x, y) => (x.attributes.premiereYear ?? 0) - (y.attributes.premiereYear ?? 0))
    } else if (a.type === 'composer') {
      related = rawData.nodes.filter(
        (n) => n.attributes.type === 'opera' && n.attributes.composerId === node.key
      ).sort((x, y) => (x.attributes.premiereYear ?? 0) - (y.attributes.premiereYear ?? 0))
    }

    return { relatedNodes: related, connections: conns }
  }, [node, rawData])

  const operaCount = useMemo(() => rawData?.nodes.filter((n) => n.attributes.type === 'opera').length ?? 0, [rawData])
  const composerCount = useMemo(() => rawData?.nodes.filter((n) => n.attributes.type === 'composer').length ?? 0, [rawData])

  return (
    <div className="w-80 flex-shrink-0 border-l border-[color:var(--c-border)] overflow-y-auto bg-[color:var(--c-panel)]">
      {node ? (
        <NodeInfo node={node} relatedNodes={relatedNodes} connections={connections} />
      ) : (
        <WelcomeState operaCount={operaCount} composerCount={composerCount} />
      )}
    </div>
  )
}
