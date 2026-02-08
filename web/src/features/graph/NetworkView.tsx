import { useEffect, useRef } from 'react'
import { SigmaContainer, useRegisterEvents, useSigma } from '@react-sigma/core'
import '@react-sigma/core/lib/style.css'
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import { useGraphStore } from '@/store/graphStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useFilterStore } from '@/store/filterStore'

function GraphEvents() {
  const sigma = useSigma()
  const registerEvents = useRegisterEvents()
  const { setSelected, setHovered } = useSelectionStore()
  const selectedNodeKeys = useSelectionStore((s) => s.selectedNodeKeys)
  const selectionSource = useSelectionStore((s) => s.selectionSource)

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => {
        setSelected(new Set([node]), 'network')
      },
      clickStage: () => {
        useSelectionStore.getState().clearSelection()
      },
      enterNode: ({ node }) => {
        setHovered(node)
      },
      leaveNode: () => {
        setHovered(null)
      },
    })
  }, [registerEvents, setSelected, setHovered])

  // Highlight selected nodes from any source
  useEffect(() => {
    const graph = sigma.getGraph()
    graph.forEachNode((node) => {
      const isSelected = selectedNodeKeys.size === 0 || selectedNodeKeys.has(node)
      graph.setNodeAttribute(node, 'highlighted', isSelected && selectedNodeKeys.size > 0)
      // Dim non-selected nodes
      const baseColor = graph.getNodeAttribute(node, 'baseColor') || graph.getNodeAttribute(node, 'color')
      if (!graph.getNodeAttribute(node, 'baseColor')) {
        graph.setNodeAttribute(node, 'baseColor', baseColor)
      }
      if (selectedNodeKeys.size > 0 && !isSelected) {
        graph.setNodeAttribute(node, 'color', '#333')
      } else {
        graph.setNodeAttribute(node, 'color', baseColor)
      }
    })
    sigma.refresh()
  }, [selectedNodeKeys, selectionSource, sigma])

  return null
}

function ForceAtlas2Layout() {
  const sigma = useSigma()
  const layoutRef = useRef<FA2Layout | null>(null)

  useEffect(() => {
    const graph = sigma.getGraph()
    if (graph.order === 0) return

    const layout = new FA2Layout(graph, {
      settings: {
        gravity: 1,
        scalingRatio: 10,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        slowDown: 5,
        adjustSizes: true,
      },
    })
    layoutRef.current = layout
    layout.start()

    // Stop after 3 seconds to settle
    const timer = setTimeout(() => {
      layout.stop()
    }, 3000)

    return () => {
      clearTimeout(timer)
      layout.kill()
      layoutRef.current = null
    }
  }, [sigma])

  return null
}

function GraphFilters() {
  const sigma = useSigma()
  const { composerFilter, eraFilter, decadeRange, searchQuery } = useFilterStore()

  useEffect(() => {
    const graph = sigma.getGraph()
    graph.forEachNode((node) => {
      const attrs = graph.getNodeAttributes(node)
      let visible = true

      if (composerFilter.length > 0) {
        if (attrs.entityType === 'opera' && attrs.composerId && !composerFilter.includes(attrs.composerId)) {
          visible = false
        }
        if (attrs.entityType === 'composer' && !composerFilter.includes(node)) {
          visible = false
        }
      }

      if (eraFilter.length > 0 && attrs.eraBucket && !eraFilter.includes(attrs.eraBucket)) {
        visible = false
      }

      if (attrs.premiereYear) {
        if (attrs.premiereYear < decadeRange[0] || attrs.premiereYear > decadeRange[1]) {
          visible = false
        }
      }

      if (searchQuery && !attrs.label?.toLowerCase().includes(searchQuery.toLowerCase())) {
        visible = false
      }

      graph.setNodeAttribute(node, 'hidden', !visible)
    })

    // Hide edges where either endpoint is hidden
    graph.forEachEdge((edge, _attrs, source, target) => {
      const sourceHidden = graph.getNodeAttribute(source, 'hidden')
      const targetHidden = graph.getNodeAttribute(target, 'hidden')
      graph.setEdgeAttribute(edge, 'hidden', sourceHidden || targetHidden)
    })

    sigma.refresh()
  }, [composerFilter, eraFilter, decadeRange, searchQuery, sigma])

  return null
}

export default function NetworkView() {
  const graph = useGraphStore((s) => s.graph)

  if (!graph) {
    return <div className="flex items-center justify-center h-full text-slate-400">Loading graph...</div>
  }

  return (
    <SigmaContainer
      graph={graph}
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      settings={{
        defaultNodeColor: '#6c757d',
        defaultEdgeColor: '#334155',
        defaultEdgeType: 'line',
        labelColor: { color: '#e2e8f0' },
        labelFont: 'Inter, system-ui, sans-serif',
        labelSize: 12,
        labelRenderedSizeThreshold: 8,
        nodeProgramClasses: {},
        enableEdgeEvents: false,
        zIndex: true,
      }}
    >
      <GraphEvents />
      <ForceAtlas2Layout />
      <GraphFilters />
    </SigmaContainer>
  )
}
