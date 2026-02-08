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
        // Sigma uses node attribute `type` to select a render program (e.g. "circle").
        // Our domain model also uses `type` ("composer", "opera"), which causes Sigma to crash.
        const attrs = {
          ...node.attributes,
          entityType: node.attributes.type,
          type: 'circle',
        }
        graph.addNode(node.key, attrs)
      }

      for (const edge of data.edges) {
        try {
          // Sigma uses edge attribute `type` to pick a render program (e.g. "line").
          // Our domain model also uses `type` ("composed_by", ...), which causes Sigma to crash.
          const attrs = {
            ...edge.attributes,
            edgeType: edge.attributes.type,
            type: 'line',
            key: edge.key,
          }
          graph.addEdge(edge.source, edge.target, {
            ...attrs,
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
