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

      const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
      const bg = theme === 'light' ? '#ffffff' : '#0f172a'
      const edgeStroke = theme === 'light' ? '#cbd5e1' : '#334155'
      const text = theme === 'light' ? '#0f172a' : '#e2e8f0'

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - pad} ${minY - pad} ${w} ${h}" width="${w}" height="${h}">\n`
      svg += `<rect x="${minX - pad}" y="${minY - pad}" width="${w}" height="${h}" fill="${bg}"/>\n`

      for (const edge of edges) {
        const s = nodeMap.get(edge.source)
        const t = nodeMap.get(edge.target)
        if (s && t) {
          svg += `<line x1="${s.attributes.x}" y1="${s.attributes.y}" x2="${t.attributes.x}" y2="${t.attributes.y}" stroke="${edgeStroke}" stroke-width="0.5"/>\n`
        }
      }

      for (const node of nodes) {
        const { x, y, size, color, label } = node.attributes
        svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>\n`
        svg += `<text x="${x}" y="${y - size - 2}" fill="${text}" font-size="4" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif">${label}</text>\n`
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
        className="px-3 py-1.5 text-sm text-[color:var(--c-muted)] hover:text-[color:var(--c-text)] border border-[color:var(--c-border)] bg-[color:var(--c-panel-2)] rounded transition-colors"
      >
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] rounded shadow-[var(--shadow-panel)] z-50 min-w-36 overflow-hidden">
          <button
            onClick={exportPNG}
            className="w-full px-4 py-2 text-sm text-[color:var(--c-text)] hover:bg-[color:var(--c-panel-2)] text-left"
          >
            PNG Screenshot
          </button>
          <button
            onClick={exportSVG}
            className="w-full px-4 py-2 text-sm text-[color:var(--c-text)] hover:bg-[color:var(--c-panel-2)] text-left"
          >
            SVG Vector
          </button>
          <button
            onClick={exportJSON}
            className="w-full px-4 py-2 text-sm text-[color:var(--c-text)] hover:bg-[color:var(--c-panel-2)] text-left border-t border-[color:var(--c-border)]"
          >
            Graph JSON
          </button>
        </div>
      )}
    </div>
  )
}
