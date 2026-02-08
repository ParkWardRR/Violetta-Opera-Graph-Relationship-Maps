import { useState } from 'react'
import { TOURS } from '@/data/tours'
import { GLOSSARY } from '@/data/glossary'
import { useGraphStore } from '@/store/graphStore'
import { useSelectionStore } from '@/store/selectionStore'
import { ERA_COLORS, ERA_RANGES, ERA_ORDER } from '@/types/graph'
import type { Tour, TourStop } from '@/data/tours'

function TourCard({ tour, onSelect }: { tour: Tour; onSelect: (tour: Tour) => void }) {
  return (
    <button
      onClick={() => onSelect(tour)}
      className="text-left w-full p-4 rounded-xl bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{tour.icon}</span>
        <div>
          <div className="text-sm font-semibold text-[color:var(--c-text)] group-hover:text-indigo-400 transition-colors">{tour.name}</div>
          <div className="text-xs text-[color:var(--c-muted)]">{tour.tagline}</div>
        </div>
      </div>
      <div className="text-[10px] text-[color:var(--c-muted-2)]">{tour.stops.length} operas</div>
    </button>
  )
}

function TourDetail({ tour, onBack, onSelectOpera }: {
  tour: Tour
  onBack: () => void
  onSelectOpera: (stop: TourStop) => void
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] mb-4 transition-colors"
      >
        <span>&larr;</span> Back to tours
      </button>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{tour.icon}</span>
        <div>
          <h2 className="text-lg font-bold text-[color:var(--c-text)]">{tour.name}</h2>
          <p className="text-sm text-[color:var(--c-muted)]">{tour.tagline}</p>
        </div>
      </div>
      <div className="space-y-3">
        {tour.stops.map((stop, i) => (
          <button
            key={stop.title}
            onClick={() => onSelectOpera(stop)}
            className="w-full text-left p-4 rounded-lg bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[color:var(--c-text)] group-hover:text-indigo-400 transition-colors">
                  {stop.title}
                </div>
                <div className="text-xs text-[color:var(--c-muted)] mt-0.5">
                  {stop.composerName} &middot; {stop.year}
                </div>
                <p className="text-xs text-[color:var(--c-muted-2)] mt-2 leading-relaxed">
                  {stop.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function GlossarySection() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      <h3 className="text-sm font-semibold text-[color:var(--c-text)] mb-3">Opera Glossary</h3>
      <p className="text-xs text-[color:var(--c-muted)] mb-4">
        New to opera? Here are the terms you'll hear most. Click any term to learn more.
      </p>
      <div className="space-y-1">
        {GLOSSARY.map((entry) => (
          <div key={entry.term}>
            <button
              onClick={() => setExpanded(expanded === entry.term ? null : entry.term)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[color:var(--c-panel-2)] transition-colors"
            >
              <span className="text-sm font-medium text-[color:var(--c-text)]">{entry.term}</span>
              <span className="text-[color:var(--c-muted-2)] text-xs">{expanded === entry.term ? '\u25B2' : '\u25BC'}</span>
            </button>
            {expanded === entry.term && (
              <div className="px-3 pb-3 pt-1">
                <p className="text-xs text-[color:var(--c-muted)] leading-relaxed">{entry.definition}</p>
                {entry.example && (
                  <p className="text-[10px] text-[color:var(--c-muted-2)] mt-1 italic">e.g., {entry.example}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EraGuide() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[color:var(--c-text)] mb-3">Eras of Opera</h3>
      <p className="text-xs text-[color:var(--c-muted)] mb-4">
        Opera evolved over 400 years. Here's the journey from courtly entertainment to modern art form.
      </p>
      <div className="space-y-3">
        {ERA_ORDER.map((era) => (
          <div key={era} className="flex gap-3 p-3 rounded-lg bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)]">
            <div
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: ERA_COLORS[era] }}
            />
            <div>
              <div className="text-sm font-medium text-[color:var(--c-text)]">{era}</div>
              <div className="text-[10px] text-[color:var(--c-muted-2)]">{ERA_RANGES[era]}</div>
              <p className="text-xs text-[color:var(--c-muted)] mt-1 leading-relaxed">{ERA_DESCRIPTIONS[era]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ERA_DESCRIPTIONS: Record<string, string> = {
  'Baroque': 'Opera is born in Italian courts. Monteverdi, Handel, and Vivaldi create ornate works with harpsichords, castrati, and mythological stories.',
  'Classical': 'Mozart arrives and changes everything. Cleaner melodies, comic plots, the rise of the full orchestra. Opera becomes entertainment for everyone.',
  'Early Romantic': 'Bellini, Donizetti, and early Verdi. Bel canto reigns -- beautiful singing above all else. Emotions get bigger, arias get more virtuosic.',
  'Late Romantic': 'Verdi and Wagner dominate. Grand opera reaches its peak -- orchestras of 100+, leitmotifs, and four-hour epics. Also Puccini\'s gorgeous verismo.',
  '20th Century': 'Rules break. Schoenberg\'s atonality, Britten\'s chamber operas, Bernstein\'s musical theater crossovers. Opera goes everywhere.',
  'Contemporary': 'Opera today. Minimalism, electronics, multimedia staging. Adams, Saariaho, and Blanchard prove the form is more alive than ever.',
}

export function DiscoverPage({ onSwitchToGraph }: { onSwitchToGraph: () => void }) {
  const [activeTour, setActiveTour] = useState<Tour | null>(null)
  const [section, setSection] = useState<'tours' | 'glossary' | 'eras'>('tours')
  const rawData = useGraphStore((s) => s.rawData)
  const { setSelected } = useSelectionStore()

  const handleSelectOpera = (stop: TourStop) => {
    if (!rawData) return

    // Try to find the node by possible keys or by title match
    let nodeKey: string | null = null
    for (const key of stop.possibleKeys) {
      if (rawData.nodes.find((n) => n.key === key)) {
        nodeKey = key
        break
      }
    }
    if (!nodeKey) {
      const match = rawData.nodes.find(
        (n) => n.attributes.label.toLowerCase() === stop.title.toLowerCase()
      )
      if (match) nodeKey = match.key
    }

    if (nodeKey) {
      setSelected(new Set([nodeKey]), 'filter')
      onSwitchToGraph()
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[color:var(--c-text)] mb-2">Discover Opera</h1>
          <p className="text-sm text-[color:var(--c-muted)] max-w-md mx-auto leading-relaxed">
            New to opera? You're in the right place. Start with a guided tour, learn the vocabulary,
            or explore 400 years of music history at your own pace.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 p-1 rounded-full bg-[color:var(--c-panel-2)]/50 border border-[color:var(--c-border)] mb-6 w-fit mx-auto">
          {(['tours', 'glossary', 'eras'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${section === tab
                ? 'bg-[color:var(--c-panel)] text-[color:var(--c-text)] shadow-sm'
                : 'text-[color:var(--c-muted)] hover:text-[color:var(--c-text)]'
              }`}
              onClick={() => { setSection(tab); setActiveTour(null) }}
            >
              {tab === 'tours' ? 'Guided Tours' : tab === 'glossary' ? 'Glossary' : 'Eras'}
            </button>
          ))}
        </div>

        {/* Content */}
        {section === 'tours' && !activeTour && (
          <div className="grid gap-3 sm:grid-cols-2">
            {TOURS.map((tour) => (
              <TourCard key={tour.id} tour={tour} onSelect={setActiveTour} />
            ))}
          </div>
        )}

        {section === 'tours' && activeTour && (
          <TourDetail
            tour={activeTour}
            onBack={() => setActiveTour(null)}
            onSelectOpera={handleSelectOpera}
          />
        )}

        {section === 'glossary' && <GlossarySection />}
        {section === 'eras' && <EraGuide />}
      </div>
    </div>
  )
}
