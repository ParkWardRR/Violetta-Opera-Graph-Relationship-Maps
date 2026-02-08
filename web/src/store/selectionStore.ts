import { create } from 'zustand'

interface SelectionState {
  selectedNodeKeys: Set<string>
  hoveredNodeKey: string | null
  selectionSource: 'network' | 'timeline' | 'filter' | null
  setSelected: (keys: Set<string>, source: 'network' | 'timeline' | 'filter') => void
  setHovered: (key: string | null) => void
  clearSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedNodeKeys: new Set<string>(),
  hoveredNodeKey: null,
  selectionSource: null,

  setSelected: (keys, source) => set({
    selectedNodeKeys: keys,
    selectionSource: source,
  }),

  setHovered: (key) => set({ hoveredNodeKey: key }),

  clearSelection: () => set({
    selectedNodeKeys: new Set<string>(),
    hoveredNodeKey: null,
    selectionSource: null,
  }),
}))
