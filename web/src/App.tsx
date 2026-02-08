import { useEffect, useState } from 'react'
import { useGraphStore } from '@/store/graphStore'
import NetworkView from '@/features/graph/NetworkView'
import TimelineView from '@/features/timeline/TimelineView'
import FilterBar from '@/components/FilterBar'
import NodeDetail from '@/components/NodeDetail'
import ExportMenu from '@/components/ExportMenu'
import EraLegend from '@/components/EraLegend'
import ThemeToggle from '@/components/ThemeToggle'
import PreferencesPage from '@/components/PreferencesPage'
import { AdminPage } from '@/components/AdminPage'
import { DiscoverPage } from '@/components/DiscoverPage'
import { EventsView } from '@/components/EventsView'
import { ScraperPage } from '@/components/ScraperPage'
import { NowPlaying } from '@/components/NowPlaying'
import { usePreferencesStore } from '@/store/preferencesStore'
import { useResolvedTheme } from '@/lib/useResolvedTheme'

type Tab = 'network' | 'timeline' | 'discover' | 'events'

const TAB_ICONS: Record<Tab, string> = {
  network: '\u25C9',
  timeline: '\u2014',
  discover: '\u2606',
  events: '\u266A',
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.14 12.94a7.98 7.98 0 0 0 .06-.94c0-.32-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.46 7.46 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
      />
    </svg>
  )
}

export default function App() {
  const { loadGraph, loading, error } = useGraphStore()
  const [activeTab, setActiveTab] = useState<Tab>('network')
  const [page, setPage] = useState<'main' | 'preferences' | 'admin' | 'scraper'>('main')
  const showEraLegend = usePreferencesStore((s) => s.showEraLegend)

  const { resolvedTheme } = useResolvedTheme()

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  if (page === 'preferences') {
    return <PreferencesPage onClose={() => setPage('main')} />
  }

  if (page === 'admin') {
    return <AdminPage onClose={() => setPage('main')} />
  }

  if (page === 'scraper') {
    return <ScraperPage onClose={() => setPage('main')} />
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[color:var(--c-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-xl animate-pulse">
            V
          </div>
          <div className="text-[color:var(--c-muted)] text-sm">Loading opera graph data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[color:var(--c-bg)]">
        <div className="text-center max-w-md">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-xl mx-auto mb-4">
            !
          </div>
          <div className="text-[color:var(--c-danger)] text-lg font-semibold mb-2">Failed to load graph data</div>
          <div className="text-[color:var(--c-muted-2)] text-sm mb-4">{error}</div>
          <div className="text-[color:var(--c-muted-2)] text-xs">
            Make sure graph.json exists at ~/Violetta-Opera-Graph-Relationship-Maps/data/processed/
          </div>
        </div>
      </div>
    )
  }

  const showGraphUI = activeTab === 'network' || activeTab === 'timeline'

  return (
    <div className="h-screen flex flex-col bg-[color:var(--c-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-2.5 bg-[color:var(--c-panel)]/80 backdrop-blur-md border-b border-[color:var(--c-border)] shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-lg select-none">
            V
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[color:var(--c-text)] tracking-tight leading-none">Violetta</h1>
            <span className="text-[10px] text-[color:var(--c-muted-2)] leading-none">Opera Graph</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex gap-0.5 p-1 rounded-full bg-[color:var(--c-panel-2)]/50 backdrop-blur-sm border border-[color:var(--c-border)] shadow-inner">
          {(['network', 'timeline', 'discover', 'events'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-[color:var(--c-panel)] text-[color:var(--c-text)] shadow-sm'
                  : 'text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] hover:bg-white/5'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="text-[10px] opacity-60">{TAB_ICONS[tab]}</span>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle resolvedTheme={resolvedTheme} />
          <button
            onClick={() => setPage('preferences')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] hover:bg-[color:var(--c-panel-2)] transition-colors"
            title="Preferences"
          >
            <GearIcon />
            <span className="hidden sm:inline">Prefs</span>
          </button>
          <button
            onClick={() => setPage('scraper')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all"
            title="URL Scraper"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Scraper
          </button>
          <ExportMenu />
        </div>
      </div>

      {/* Filter Bar (only for graph views) */}
      {showGraphUI && <FilterBar />}

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {activeTab === 'discover' ? (
          <div className="flex-1">
            <DiscoverPage onSwitchToGraph={() => setActiveTab('network')} />
          </div>
        ) : activeTab === 'events' ? (
          <div className="flex-1">
            <EventsView />
          </div>
        ) : (
          <>
            <div className="flex-1 relative">
              {activeTab === 'network' ? (
                <NetworkView resolvedTheme={resolvedTheme} />
              ) : (
                <TimelineView resolvedTheme={resolvedTheme} />
              )}
              {showEraLegend ? <EraLegend /> : null}
              <NowPlaying onViewAll={() => setActiveTab('events')} />
            </div>
            <NodeDetail />
          </>
        )}
      </div>
    </div>
  )
}
