import LoginFormClient from '@/components/auth/LoginFormClient';
import LoginIllustration from '@/features/auth/components/LoginIllustration';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f4f5e8] p-4 text-start text-base font-normal leading-6 text-[#10130f] select-none dark:bg-[#050704] dark:text-[#f4f7e9] md:items-center md:p-8">
      
      {/* Background mesh grid - Landing page style */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />
      
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

      {/* Curved dashed lines (flight paths) running behind the card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
        <svg className="absolute top-[15%] left-[-10%] w-[120%] h-[35%] opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M -5 30 C 30 75, 70 15, 105 45" fill="none" stroke="var(--color-flight-path)" strokeWidth="1.6" strokeDasharray="4 8" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
        </svg>
        <svg className="absolute bottom-[15%] left-[-10%] w-[120%] h-[35%] opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 105 35 C 70 80, 30 15, -5 55" fill="none" stroke="var(--color-flight-path)" strokeWidth="1.6" strokeDasharray="4 8" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
        </svg>
      </div>

      {/* Responsive unified container card */}
      <div
        className="animate-fade-slide-up relative z-10 flex h-auto min-h-0 w-full flex-col items-stretch justify-start overflow-hidden rounded-[32px] border border-[#172113]/20 bg-[#fbfcf2] text-start text-base font-normal leading-6 tracking-[-0.011em] text-[#10130f] opacity-100 shadow-[0_24px_70px_rgba(31,43,18,0.16)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:text-[#f4f7e9] dark:shadow-[0_24px_70px_rgba(0,0,0,0.54)] md:mx-0 md:h-[650px] md:min-h-0 md:w-full md:max-w-[850px] md:flex-row md:rounded-[32px] md:p-0">
        
          {/* Small top illustration for mobile only, merged into a single card */}
          <div className="md:hidden flex h-[175px] sm:h-[190px] w-full items-center justify-center overflow-hidden relative">
            <div className="absolute top-[-42px] sm:top-[-53px] left-1/2 -translate-x-1/2 w-[384px] h-[529px] scale-[0.55] sm:scale-[0.63] origin-top flex-shrink-0">
              <LoginIllustration />
            </div>
          </div>

          {/* Left side: Illustration area (visible on desktop) */}
          <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-r border-[#172113]/14 bg-gradient-to-b from-[#eef3d6]/40 to-transparent dark:border-[#d5e6a9]/14 dark:from-[#1a2513]/40 md:flex">
            <div className="relative w-[384px] h-[529px] scale-[0.9] lg:scale-100 origin-center">
              <LoginIllustration />
            </div>
          </div>

          {/* Right side: Branding + Login Form */}
          <div className="flex w-full flex-1 flex-col justify-between p-6 md:w-[460px] md:flex-none md:shrink-0 md:p-8">
            <div className="w-full flex flex-col justify-center items-start my-auto">
              {/* Branding Header */}
              <div data-layer="Branding:margin" className="self-stretch pb-6 flex flex-col justify-start items-start">
                <div data-layer="Branding" className="self-stretch flex flex-col justify-start items-start gap-1">
                  <div data-layer="Heading 1" className="Heading1 self-stretch inline-flex justify-center items-center gap-2">
                    <h1 data-layer="Kivora English" className="KivoraEnglish text-center justify-center text-[#10130f] text-2xl font-bold font-montserrat leading-8 dark:text-[#f4f7e9]">
                      Kivora English
                    </h1>
                  </div>
                  <div data-layer="Container" className="self-stretch flex flex-col justify-start items-center">
                    <p data-layer="Welcome back! Ready to level up your English?" className="WelcomeBackReadyToLevelUpYourEnglish text-center justify-center text-[#425039] text-sm leading-6 font-inter dark:text-[#b9c3a4]">
                      Welcome back! Ready to level up your<br />English?
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <div data-layer="Login Form:margin" className="self-stretch w-full">
                <LoginFormClient />
              </div>
            </div>
          </div>
      </div>

    </div>);

}
