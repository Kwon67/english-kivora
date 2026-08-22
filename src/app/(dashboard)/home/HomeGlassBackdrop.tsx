type HomeGlassBackdropProps = {
  variant?: 'compact' | 'hero'
}

export default function HomeGlassBackdrop({ variant = 'compact' }: HomeGlassBackdropProps) {
  const isHero = variant === 'hero'
  const accentClass = isHero ? 'bg-brand-accent/10' : 'bg-brand-accent/20'

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-container">
      <span
        className={`absolute rounded-full ${accentClass} ${
          isHero
            ? '-right-20 -top-28 h-80 w-80 sm:h-96 sm:w-96'
            : '-right-12 -top-16 h-52 w-52'
        }`}
      />
      <span
        className={`absolute -rotate-6 rounded-container bg-white/55 ${
          isHero
            ? '-bottom-16 left-[8%] h-36 w-[28rem] max-w-[70%]'
            : '-bottom-12 left-[8%] h-28 w-64'
        }`}
      />
      <span className="absolute inset-y-0 left-[38%] w-px bg-brand-dark/15" />
    </div>
  )
}
