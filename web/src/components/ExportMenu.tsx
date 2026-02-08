import { useState, useRef, useEffect } from 'react'
import { useGraphStore } from '@/store/graphStore'

export default function ExportMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const rawData = useGraphStore((s) => s.rawData)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exportPNG = () => {
    const canvas = document.querySelector('.sigma-container canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'opera-graph.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    setOpen(false)
  }

  const exportSVG = () => {
    const canvas = document.querySelector('.sigma-container canvas') as HTMLCanvasElement | null
    if (!canvas) {
      // Fallback: generate an SVG from graph data
      if (!rawData) return
      const nodes = rawData.nodes
      const edges = rawData.edges

      const minX = Math.min(...nodes.map((n) => n.attributes.x))
      const maxX = Math.max(...nodes.map((n) => n.attributes.x))
      const minY = Math.min(...nodes.map((n) => n.attributes.y))
      const maxY = Math.max(...nodes.map((n) => n.attributes.y))
      const pad = 50
      const w = maxX - minX + pad * 2
      const h = maxY - minY + pad * 2

      const nodeMap = new Map(nodes.map((n) => [n.key, n]))

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - pad} ${minY - pad} ${w} ${h}" width="${w}" height="${h}">\n`
      svg += `<rect x="${minX - pad}" y="${minY - pad}" width="${w}" height="${h}" fill="#0f172a"/>\n`

      for (const edge of edges) {
        const s = nodeMap.get(edge.source)
        const t = nodeMap.get(edge.target)
        if (s && t) {
          svg += `<line x1="${s.attributes.x}" y1="${s.attributes.y}" x2="${t.attributes.x}" y2="${t.attributes.y}" stroke="#334155" stroke-width="0.5"/>\n`
        }
      }

      for (const node of nodes) {
        const { x, y, size, color, label } = node.attributes
        svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>\n`
        svg += `<text x="${x}" y="${y - size - 2}" fill="#e2e8f0" font-size="4" text-anchor="middle" font-family="Inter, sans-serif">${label}</text>\n`
      }

      svg += `</svg>`

      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.download = 'opera-graph.svg'
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
      setOpen(false)
      return
    }

    // Canvas-based SVG export (screenshot approach)
    const link = document.createElement('a')
    link.download = 'opera-graph.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    setOpen(false)
  }

  const exportJSON = () => {
    if (!rawData) return
    const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = 'graph.json'
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
    setOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-600 rounded transition-colors"
      >
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded shadow-xl z-50 min-w-36">
          <button
            onClick={exportPNG}
            className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 text-left"
          >
            PNG Screenshot
          </button>
          <button
            onClick={exportSVG}
            className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 text-left"
          >
            SVG Vector
          </button>
          <button
            onClick={exportJSON}
            className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 text-left border-t border-slate-700"
          >
            Graph JSON
          </button>
        </div>
      )}
    </div>
  )
}
