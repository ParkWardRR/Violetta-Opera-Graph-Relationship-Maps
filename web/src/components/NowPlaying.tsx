import { useEffect, useState } from 'react'
import type { PerformanceEvent } from '@/types/graph'

export function NowPlaying({ onViewAll }: { onViewAll: () => void }) {
  const [events, setEvents] = useState<PerformanceEvent[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/events`)
      .then((res) => {
        if (!res.ok) throw new Error('not available')
        return res.json()
      })
      .then((data: PerformanceEvent[]) => {
        setEvents(data.slice(0, 5))
        setLoaded(true)
      })
      .catch(() => {
        setLoaded(true)
      })
  }, [])

  if (!loaded || events.length === 0) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-[color:var(--c-panel)]/90 backdrop-blur-md border-t border-[color:var(--c-border)]" data-testid="now-playing">
      <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto">
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Now Playing</span>
        </div>
        <div className="h-4 w-px bg-[color:var(--c-border)] flex-shrink-0" />
        {events.map((event, i) => (
          <div
            key={event.event_id || i}
            className="flex-shrink-0 flex items-center gap-2 bg-[color:var(--c-panel-2)]/80 rounded-lg px-3 py-1.5 border border-[color:var(--c-border)] hover:border-[color:var(--c-accent)]/30 transition-colors"
          >
            <div>
              <div className="text-[11px] font-medium text-[color:var(--c-text)] whitespace-nowrap">
                {event.opera_title}
              </div>
              <div className="text-[10px] text-[color:var(--c-muted)] whitespace-nowrap">
                {event.venue_name}
                {event.dates?.[0] ? ` \u00B7 ${event.dates[0]}` : ''}
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={onViewAll}
          className="flex-shrink-0 text-[11px] font-medium text-[color:var(--c-accent)] hover:text-[color:var(--c-accent-2)] transition-colors whitespace-nowrap"
        >
          View all &rarr;
        </button>
      </div>
    </div>
  )
}
