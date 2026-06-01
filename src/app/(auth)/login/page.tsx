import LoginFormClient from '@/components/auth/LoginFormClient';
import LoginIllustration from '@/features/auth/components/LoginIllustration';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-zinc-50 p-4 text-start text-base font-normal leading-6 text-text select-none md:items-center md:p-8">
      
      {/* Background mesh grid - Original texture requested by user */}
      <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#065f46_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px] z-0 pointer-events-none" />
      
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500/12 blur-[85px] animate-float-1" />
        <div className="absolute -bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[95px] animate-float-2" />
      </div>

      {/* Responsive unified container card */}
      <div
        className="animate-fade-slide-up relative z-10 flex h-auto min-h-[calc(100vh-2rem)] w-full flex-col items-stretch justify-start overflow-hidden rounded-[32px] bg-white text-start text-base font-normal leading-6 tracking-[-0.011em] text-text opacity-100 md:mx-0 md:h-[650px] md:min-h-0 md:w-full md:max-w-[850px] md:flex-row md:rounded-[32px] md:p-0"
        style={{
          background: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 32px 64px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
        
          {/* Small top illustration for mobile only, merged into a single card */}
          <div className="md:hidden flex h-[150px] w-full items-center justify-center overflow-hidden relative">
            <div className="absolute top-[-51px] sm:top-[-60px] left-1/2 -translate-x-1/2 w-[384px] h-[529px] scale-[0.45] sm:scale-[0.52] origin-top flex-shrink-0">
              <LoginIllustration />
            </div>
          </div>

          {/* Left side: Illustration area (visible on desktop) */}
          <div className="hidden md:flex flex-1 bg-gradient-to-b from-emerald-50/20 to-transparent relative items-center justify-center overflow-hidden border-r border-zinc-200/40">
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
                    <h1 data-layer="Kivora English" className="KivoraEnglish text-center justify-center text-zinc-900 text-2xl font-bold font-montserrat leading-8">
                      Kivora English
                    </h1>
                  </div>
                  <div data-layer="Container" className="self-stretch flex flex-col justify-start items-center">
                    <p data-layer="Welcome back! Ready to level up your English?" className="WelcomeBackReadyToLevelUpYourEnglish text-center justify-center text-zinc-500 text-sm leading-6 font-inter">
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
