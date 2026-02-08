import { ERA_COLORS, ERA_RANGES, ERA_ORDER } from '@/types/graph'

export default function EraLegend() {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-[color:var(--c-panel)]/90 backdrop-blur border border-[color:var(--c-border)] rounded-lg p-3 shadow-[var(--shadow-panel)]">
      <div className="text-[10px] font-medium text-[color:var(--c-muted-2)] uppercase tracking-wider mb-2">Eras</div>
      <div className="space-y-1.5">
        {ERA_ORDER.map((era) => (
          <div key={era} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: ERA_COLORS[era] }}
            />
            <span className="text-[11px] text-[color:var(--c-text)] leading-none">{era}</span>
            <span className="text-[10px] text-[color:var(--c-muted-2)] leading-none ml-auto">{ERA_RANGES[era]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-[color:var(--c-border)]">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#6c757d]" />
          <span className="text-[11px] text-[color:var(--c-muted)] leading-none">Composer</span>
        </div>
      </div>
    </div>
  )
}
