import Image from 'next/image'

export default function LoginHeroIllustration() {
  return (
    <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/16 bg-[linear-gradient(145deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-8">
      <div className="absolute left-0 top-0 h-full w-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent)]" />
      <div className="absolute right-5 top-5 h-2 w-16 rounded-full bg-white/24" />
      <div className="absolute bottom-5 left-5 h-2 w-28 rounded-full bg-white/16" />
      <Image
        src="/images/login/undraw-login.svg"
        alt="Ilustração estática de login do unDraw"
        width={740}
        height={520}
        priority
        className="relative z-10 h-full w-full object-contain drop-shadow-[0_24px_42px_rgba(0,0,0,0.18)]"
      />
    </div>
  )
}
