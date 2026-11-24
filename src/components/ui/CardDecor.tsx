export function CardChip() {
  return (
    <div className="relative h-10 w-12 shrink-0">
      <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/25 blur-md" />
      <div className="absolute left-1/2 top-1/2 grid h-7 w-10 -translate-x-1/2 -translate-y-1/2 grid-cols-3 grid-rows-2 gap-px rounded-[5px] border border-yellow-800/30 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 p-[3px] shadow-inner shadow-yellow-900/40">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="rounded-[1px] bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-500" />
        ))}
      </div>
    </div>
  )
}

export function CardTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 14px)',
      }}
    />
  )
}

export function CardBrandMark() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center">
        <span className="h-6 w-6 rounded-full bg-red-500" />
        <span className="-ml-2.5 h-6 w-6 rounded-full bg-orange-400 mix-blend-plus-lighter" />
      </div>
      <span className="text-[9px] font-semibold italic tracking-tight text-white/90">mastercard</span>
    </div>
  )
}
