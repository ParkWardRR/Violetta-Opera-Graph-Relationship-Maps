import { useEffect, useState } from 'react'
import { useGraphStore } from '@/store/graphStore'
import NetworkView from '@/features/graph/NetworkView'
import TimelineView from '@/features/timeline/TimelineView'
import FilterBar from '@/components/FilterBar'
import NodeDetail from '@/components/NodeDetail'

type Tab = 'network' | 'timeline'

export default function App() {
  const { loadGraph, loading, error } = useGraphStore()
  const [activeTab, setActiveTab] = useState<Tab>('network')

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400 text-lg">Loading opera graph data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Failed to load graph data</div>
          <div className="text-slate-500 text-sm">{error}</div>
          <div className="text-slate-600 text-xs mt-4">
            Make sure graph.json exists at ~/Violetta-Opera-Graph-Relationship-Maps/data/processed/
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <h1 className="text-sm font-semibold text-white tracking-wide">Violetta Opera Graph</h1>
        <div className="flex gap-1">
          <button
            className={`px-4 py-1.5 text-sm rounded-t ${
              activeTab === 'network'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('network')}
          >
            Network
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded-t ${
              activeTab === 'timeline'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>
        <div className="w-32" /> {/* Spacer for balance */}
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Main Content */}
      <div className="flex-1 relative">
        <div className={activeTab === 'network' ? 'h-full' : 'hidden'}>
          <NetworkView />
        </div>
        <div className={activeTab === 'timeline' ? 'h-full' : 'hidden'}>
          <TimelineView />
        </div>
        <NodeDetail />
      </div>
    </div>
  )
}
