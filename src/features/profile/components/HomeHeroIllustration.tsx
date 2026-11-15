import Image from 'next/image'

type HomeHeroIllustrationProps = {
  className?: string
}

export default function HomeHeroIllustration({ className = '' }: HomeHeroIllustrationProps) {
  return (
    <div className={`relative select-none ${className}`}>
      <Image
        src="/images/mindmarket/discovery.png"
        alt="Duas pessoas descobrem o mundo com um globo e um livro."
        width={1536}
        height={1024}
        className="h-auto w-full object-contain"
        priority
        unoptimized
      />
    </div>
  )
}
