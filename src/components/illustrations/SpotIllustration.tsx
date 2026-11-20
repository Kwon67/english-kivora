import Image from 'next/image'

const dimensions = {
  plane: [224, 224], burst: [224, 224], chat: [224, 224],
  bolt: [224, 224], question: [224, 224], ticks: [224, 224], dots: [224, 224],
  pencil: [224, 224], moon: [224, 224], sunflower: [224, 224], sun: [224, 224],
  books: [460, 318],
} as const

export type SpotMotif = keyof typeof dimensions

/** Decorative ImageGen artwork. Controls keep their own accessible icons and labels. */
export default function SpotIllustration({ motif, className, eager = false }: {
  motif: SpotMotif
  className?: string
  eager?: boolean
}) {
  const [width, height] = dimensions[motif]
  return <Image
    src={`/images/journey-details/${motif}.webp`}
    alt=""
    unoptimized
    loading={eager ? 'eager' : 'lazy'}
    fetchPriority={eager ? 'low' : undefined}
    width={width}
    height={height}
    className={className}
  />
}
