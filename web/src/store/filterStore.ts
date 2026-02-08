import { create } from 'zustand'

interface FilterState {
  composerFilter: string[]
  eraFilter: string[]
  decadeRange: [number, number]
  searchQuery: string
  setComposerFilter: (ids: string[]) => void
  setEraFilter: (eras: string[]) => void
  setDecadeRange: (range: [number, number]) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
}

const DEFAULT_DECADE_RANGE: [number, number] = [1600, 2030]

export const useFilterStore = create<FilterState>((set) => ({
  composerFilter: [],
  eraFilter: [],
  decadeRange: DEFAULT_DECADE_RANGE,
  searchQuery: '',

  setComposerFilter: (ids) => set({ composerFilter: ids }),
  setEraFilter: (eras) => set({ eraFilter: eras }),
  setDecadeRange: (range) => set({ decadeRange: range }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  resetFilters: () => set({
    composerFilter: [],
    eraFilter: [],
    decadeRange: DEFAULT_DECADE_RANGE,
    searchQuery: '',
  }),
}))
