import Image from 'next/image'

export default function LoginHeroIllustration() {
  return (
    <div className="relative aspect-[760/540] w-full overflow-hidden rounded-[1rem] border border-white/14 bg-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.24),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
      <div className="absolute left-[8%] top-[12%] h-[20%] w-[24%] rounded-[0.9rem] border border-white/14 bg-[#fff0d6]/90" />
      <div className="absolute right-[8%] top-[11%] h-[18%] w-[22%] rounded-[0.9rem] border border-white/14 bg-[#dcecff]/90" />
      <div className="absolute bottom-[18%] left-[10%] h-[17%] w-[18%] rounded-[0.9rem] border border-white/14 bg-white/90" />
      <div className="absolute bottom-[17%] right-[10%] h-[18%] w-[18%] rounded-[0.9rem] border border-white/14 bg-white/90" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex aspect-square w-[52%] min-w-[13rem] items-center justify-center rounded-full bg-white shadow-[0_20px_60px_rgba(8,35,30,0.22)]">
          <Image
            src="/images/login/icons8-learning-animated.gif"
            alt="Ilustração animada Learning do Icons8"
            width={512}
            height={512}
            unoptimized
            priority
            className="h-[78%] w-[78%] object-contain"
          />
        </div>
      </div>
    </div>
  )
}
