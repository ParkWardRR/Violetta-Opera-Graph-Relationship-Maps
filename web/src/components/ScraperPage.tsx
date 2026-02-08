import { useEffect, useState } from 'react'
import { useEventsStore } from '@/store/eventsStore'

export function ScraperPage({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const { scraping, error, scrapeResult, sources, scrapeUrl, loadSources, clearError } = useEventsStore()

  useEffect(() => {
    loadSources()
  }, [loadSources])

  const handleScrape = () => {
    if (!url.trim()) return
    clearError()
    scrapeUrl(url.trim(), label.trim())
  }

  return (
    <div className="h-screen flex flex-col bg-[color:var(--c-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[color:var(--c-panel)]/80 backdrop-blur-md border-b border-[color:var(--c-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white font-bold text-lg select-none">S</div>
          <h1 className="text-base font-semibold text-[color:var(--c-text)]">URL Scraper</h1>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 text-sm rounded-lg text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] hover:bg-[color:var(--c-panel-2)] transition-colors"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Description */}
          <div className="mb-6">
            <p className="text-sm text-[color:var(--c-muted)] leading-relaxed">
              Drop in any opera venue URL and Violetta will intelligently extract event data using
              JSON-LD structured data, DOM heuristics, and fuzzy title matching.
            </p>
          </div>

          {/* Input Form */}
          <div className="p-4 rounded-xl bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] mb-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider block mb-1.5">
                  URL to scrape
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.metopera.org/season/2025-26-season/"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text)] placeholder:text-[color:var(--c-muted-2)] outline-none focus:border-emerald-500/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider block mb-1.5">
                  Label (optional)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Met Opera Season 2025-26"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text)] placeholder:text-[color:var(--c-muted-2)] outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <button
                onClick={handleScrape}
                disabled={scraping || !url.trim()}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {scraping ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scraping...
                  </>
                ) : (
                  'Scrape URL'
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-6">
              {error}
            </div>
          )}

          {/* Results */}
          {scrapeResult && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[color:var(--c-text)]">
                  Scrape Results
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Strategy: {scrapeResult.strategy}
                </span>
              </div>

              {scrapeResult.count === 0 ? (
                <div className="p-4 rounded-lg bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] text-center">
                  <div className="text-sm text-[color:var(--c-muted)]">No events extracted</div>
                  <p className="text-xs text-[color:var(--c-muted-2)] mt-1">
                    The page may not contain structured event data. Try a venue's calendar or season page.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-[color:var(--c-muted-2)]">{scrapeResult.count} events found</div>
                  {scrapeResult.events.map((event, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)]">
                      <div className="text-sm font-medium text-[color:var(--c-text)]">{event.opera_title}</div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {event.dates?.length > 0 && (
                          <span className="text-[10px] text-[color:var(--c-muted)]">{event.dates[0]}</span>
                        )}
                        {event.venue_name && (
                          <span className="text-[10px] text-indigo-400">{event.venue_name}</span>
                        )}
                        {event.city && (
                          <span className="text-[10px] text-[color:var(--c-muted-2)]">{event.city}{event.state ? `, ${event.state}` : ''}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Previously Scraped Sources */}
          {sources.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[color:var(--c-text)] mb-3">
                Scraped Sources ({sources.length})
              </h2>
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[color:var(--c-text)] truncate">{source.label || source.url}</div>
                      <div className="text-[10px] text-[color:var(--c-muted-2)] truncate">{source.url}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-xs text-[color:var(--c-text)]">{source.event_count} events</div>
                      <div className="text-[10px] text-[color:var(--c-muted-2)]">
                        {new Date(source.scraped_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help */}
          <div className="mt-8 p-4 rounded-lg bg-[color:var(--c-panel-2)]/50 border border-[color:var(--c-border)]">
            <h3 className="text-xs font-medium text-[color:var(--c-muted)] mb-2">How smart scraping works</h3>
            <div className="space-y-1.5 text-[10px] text-[color:var(--c-muted-2)]">
              <div><strong className="text-[color:var(--c-muted)]">1. JSON-LD</strong> -- Checks for Schema.org structured data (Event, MusicEvent, TheaterEvent). Best quality.</div>
              <div><strong className="text-[color:var(--c-muted)]">2. DOM Heuristics</strong> -- Scans for common patterns: .event, .performance, .calendar classes + date detection.</div>
              <div><strong className="text-[color:var(--c-muted)]">3. Meta Fallback</strong> -- Extracts page title and description from OpenGraph/meta tags.</div>
              <div><strong className="text-[color:var(--c-muted)]">4. Fuzzy Matching</strong> -- Matches scraped titles against known operas using Levenshtein distance.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
