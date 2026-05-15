import Image from 'next/image'

export default function LoginHeroIllustration() {
  return (
    <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[1rem] border border-white/14 bg-white/10 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-8">
      <Image
        src="/images/login/undraw-login.svg"
        alt="Ilustração estática de login do unDraw"
        width={740}
        height={520}
        priority
        className="h-full w-full object-contain"
      />
    </div>
  )
}
