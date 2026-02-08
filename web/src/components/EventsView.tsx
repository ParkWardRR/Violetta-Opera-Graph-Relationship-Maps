import { useEffect, useState } from 'react'
import { useEventsStore } from '@/store/eventsStore'

const REGIONS: Record<string, string> = {
  '': 'All Regions',
  socal: 'Southern California',
  norcal: 'Northern California',
  nm: 'New Mexico',
  atl: 'Atlanta',
  custom: 'Custom Sources',
}

export function EventsView() {
  const { events, loading, error, loadEvents } = useEventsStore()
  const [region, setRegion] = useState('')

  useEffect(() => {
    loadEvents(region || undefined)
  }, [region, loadEvents])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[color:var(--c-text)]">Local Events</h1>
            <p className="text-xs text-[color:var(--c-muted)] mt-1">
              Opera performances happening near you, scraped from venue websites.
            </p>
          </div>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] text-[color:var(--c-text)] outline-none"
          >
            {Object.entries(REGIONS).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-12 text-[color:var(--c-muted)]">
            Loading events...
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-[color:var(--c-danger)] text-sm mb-2">Failed to load events</div>
            <div className="text-[color:var(--c-muted-2)] text-xs">{error}</div>
            <p className="text-[color:var(--c-muted-2)] text-xs mt-4">
              Make sure the scraper backend is running: <code className="px-1.5 py-0.5 rounded bg-[color:var(--c-panel-2)]">make server</code>
            </p>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">&#127917;</div>
            <div className="text-sm font-medium text-[color:var(--c-text)] mb-2">No events yet</div>
            <p className="text-xs text-[color:var(--c-muted)] max-w-sm mx-auto">
              Events appear here after you scrape venue websites. Use the Scraper tab to add data sources,
              or run <code className="px-1.5 py-0.5 rounded bg-[color:var(--c-panel-2)]">make scrape-regional-all</code> to fetch from all configured venues.
            </p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-[color:var(--c-muted-2)] mb-3">
              {events.length} event{events.length !== 1 ? 's' : ''} found
            </div>
            {events.map((event, i) => (
              <div
                key={event.event_id || i}
                className="p-4 rounded-lg bg-[color:var(--c-panel-2)] border border-[color:var(--c-border)] hover:border-[color:var(--c-accent)]/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[color:var(--c-text)]">
                      {event.opera_title || event.event_id}
                    </div>
                    {event.composer && (
                      <div className="text-xs text-[color:var(--c-muted)] mt-0.5">{event.composer}</div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {event.venue_name && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {event.venue_name}
                        </span>
                      )}
                      {event.city && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--c-panel)] text-[color:var(--c-muted)] border border-[color:var(--c-border)]">
                          {event.city}{event.state ? `, ${event.state}` : ''}
                        </span>
                      )}
                      {event.region && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {event.region}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {event.dates && event.dates.length > 0 && (
                      <div className="text-xs text-[color:var(--c-text)]">
                        {event.dates[0]}
                      </div>
                    )}
                    {event.source_url && (
                      <a
                        href={event.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
                      >
                        View source &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
