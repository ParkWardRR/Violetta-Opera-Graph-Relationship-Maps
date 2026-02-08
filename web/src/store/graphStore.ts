import { create } from 'zustand'
import Graph from 'graphology'
import type { GraphDocument } from '@/types/graph'

interface GraphState {
  graph: Graph | null
  rawData: GraphDocument | null
  loading: boolean
  error: string | null
  loadGraph: () => Promise<void>
}

export const useGraphStore = create<GraphState>((set) => ({
  graph: null,
  rawData: null,
  loading: false,
  error: null,

  loadGraph: async () => {
    set({ loading: true, error: null })
    try {
      // Vite serves graph.json from publicDir (~/Violetta-Opera-Graph-Relationship-Maps/data/processed/)
      const response = await fetch('/graph.json')
      if (!response.ok) throw new Error(`Failed to load graph.json: ${response.statusText}`)

      const data: GraphDocument = await response.json()

      const graph = new Graph({ type: 'mixed', multi: false, allowSelfLoops: false })

      for (const node of data.nodes) {
        graph.addNode(node.key, node.attributes)
      }

      for (const edge of data.edges) {
        try {
          graph.addEdge(edge.source, edge.target, {
            ...edge.attributes,
            key: edge.key,
          })
        } catch {
          // Skip duplicate edges or missing nodes
        }
      }

      set({ graph, rawData: data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
}))
