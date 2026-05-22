import Image from 'next/image'

type HomeHeroIllustrationProps = {
  className?: string
}

export default function HomeHeroIllustration({ className = '' }: HomeHeroIllustrationProps) {
  return (
    <div className={`relative select-none ${className}`}>
      <Image
        src="/images/home/undraw-online-learning.svg"
        alt="Ilustração unDraw de estudo online"
        width={692}
        height={500}
        className="h-auto w-full object-contain"
        priority
        unoptimized
      />
    </div>
  )
}
