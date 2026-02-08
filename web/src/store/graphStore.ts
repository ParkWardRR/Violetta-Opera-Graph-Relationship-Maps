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
      // import.meta.env.BASE_URL is "/" locally and "/Violetta-Opera-Graph-Relationship-Maps/" on GH Pages
      const response = await fetch(`${import.meta.env.BASE_URL}graph.json`)
      if (!response.ok) throw new Error(`Failed to load graph.json: ${response.statusText}`)

      const data: GraphDocument = await response.json()

      const graph = new Graph({ type: 'mixed', multi: false, allowSelfLoops: false })

      // Filter out nodes with broken data (unresolved Wikidata Q-IDs or empty labels)
      const validNodeKeys = new Set<string>()
      for (const node of data.nodes) {
        const label = node.attributes.label
        if (!label || /^Q\d+$/.test(label)) continue
        validNodeKeys.add(node.key)

        // Sigma uses node attribute `type` to select a render program (e.g. "circle").
        // Our domain model also uses `type` ("composer", "opera"), which causes Sigma to crash.
        const attrs = {
          ...node.attributes,
          entityType: node.attributes.type,
          type: 'circle',
        }
        graph.addNode(node.key, attrs)
      }

      // Filter data.nodes for rawData too
      data.nodes = data.nodes.filter((n) => validNodeKeys.has(n.key))

      for (const edge of data.edges) {
        try {
          // Skip edges pointing to/from filtered nodes or empty targets
          if (!edge.source || !edge.target) continue
          if (!validNodeKeys.has(edge.source) || !validNodeKeys.has(edge.target)) continue

          // Sigma uses edge attribute `type` to pick a render program (e.g. "line").
          // Our domain model also uses `type` ("composed_by", ...), which causes Sigma to crash.
          const attrs = {
            ...edge.attributes,
            edgeType: edge.attributes.type,
            label: edge.attributes.type.replace(/_/g, ' '),
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

      // Filter edges in rawData too
      data.edges = data.edges.filter((e) => e.source && e.target && validNodeKeys.has(e.source) && validNodeKeys.has(e.target))

      set({ graph, rawData: data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
}))
