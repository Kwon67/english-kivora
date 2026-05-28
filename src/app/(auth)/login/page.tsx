'use client'

import LoginForm from '@/features/auth/components/LoginForm'
import LoginIllustration from '@/features/auth/components/LoginIllustration'
import { m } from 'framer-motion'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-0 sm:p-6 overflow-y-auto bg-zinc-50 dark:bg-stone-950 select-none">
      
      {/* Background mesh grid - Original texture requested by user */}
      <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#00A85F_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px] z-0 pointer-events-none" />
      
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500/12 dark:bg-emerald-400/8 blur-[85px] animate-float-1" />
        <div className="absolute -bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-amber-500/10 dark:bg-amber-400/6 blur-[95px] animate-float-2" />
      </div>

      {/* Main mockup card in centered layout representing the Figma mobile frame */}
      <m.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[384px] h-[1129px] relative z-10 bg-transparent overflow-hidden shrink-0"
      >
        <div data-layer="Rectangle 1" className="Rectangle1 w-full h-full left-0 top-0 absolute bg-gradient-to-b from-emerald-50/10 to-transparent dark:from-emerald-950/10 dark:to-transparent pointer-events-none" />

        {/* The complete illustration SVG paths from Figma */}
        <LoginIllustration />

        {/* The form container absolute positioned at top 529px */}
        <div
          data-layer="Main Container - Split Layout for Desktop, Single Column for Mobile"
          className="w-full h-[600px] left-0 top-[529px] absolute bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-tl-[32px] rounded-tr-[32px] outline outline-1 outline-offset-[-1px] outline-zinc-200/50 dark:outline-zinc-800/50 flex flex-col justify-start items-start p-6"
        >
          <div data-layer="Left Side - Form Area" className="w-full flex flex-col justify-center items-start">
            
            {/* Branding:margin */}
            <div data-layer="Branding:margin" className="self-stretch pb-12 flex flex-col justify-start items-start">
              <div data-layer="Branding" className="self-stretch flex flex-col justify-start items-start gap-2">
                <div data-layer="Heading 1" className="Heading1 self-stretch inline-flex justify-center items-center gap-2">
                  <h1 data-layer="Kivora English" className="KivoraEnglish text-center justify-center text-zinc-900 dark:text-white text-2xl font-bold font-montserrat leading-8">
                    Kivora English
                  </h1>
                </div>
                <div data-layer="Container" className="self-stretch flex flex-col justify-start items-center">
                  <p data-layer="Welcome back! Ready to level up your English?" className="WelcomeBackReadyToLevelUpYourEnglish text-center justify-center text-zinc-500 dark:text-zinc-400 text-sm leading-6 font-inter">
                    Welcome back! Ready to level up your<br />English?
                  </p>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div data-layer="Login Form:margin" className="self-stretch w-full">
              <LoginForm />
            </div>

          </div>
        </div>

      </m.div>

    </div>
  )
}

