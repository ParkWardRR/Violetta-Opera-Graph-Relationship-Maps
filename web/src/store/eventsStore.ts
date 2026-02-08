import { create } from 'zustand'
import type { PerformanceEvent, CustomSource } from '@/types/graph'

const API_BASE = '/api'

interface EventsState {
  events: PerformanceEvent[]
  sources: CustomSource[]
  loading: boolean
  scraping: boolean
  error: string | null
  scrapeResult: { events: PerformanceEvent[]; strategy: string; count: number } | null
  loadEvents: (region?: string) => Promise<void>
  loadSources: () => Promise<void>
  scrapeUrl: (url: string, label: string) => Promise<void>
  clearError: () => void
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  sources: [],
  loading: false,
  scraping: false,
  error: null,
  scrapeResult: null,

  loadEvents: async (region?: string) => {
    set({ loading: true, error: null })
    try {
      const params = region ? `?region=${encodeURIComponent(region)}` : ''
      const res = await fetch(`${API_BASE}/events${params}`)
      if (!res.ok) throw new Error(`Failed to load events: ${res.statusText}`)
      const events = await res.json()
      set({ events, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  loadSources: async () => {
    try {
      const res = await fetch(`${API_BASE}/sources`)
      if (!res.ok) throw new Error(`Failed to load sources: ${res.statusText}`)
      const sources = await res.json()
      set({ sources })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  scrapeUrl: async (url: string, label: string) => {
    set({ scraping: true, error: null, scrapeResult: null })
    try {
      const res = await fetch(`${API_BASE}/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, label }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Scrape failed: ${res.statusText}`)
      }
      const result = await res.json()
      set({ scrapeResult: result, scraping: false })
    } catch (e) {
      set({ error: (e as Error).message, scraping: false })
    }
  },

  clearError: () => set({ error: null }),
}))
