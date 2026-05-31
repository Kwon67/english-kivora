import LoginFormClient from '@/components/auth/LoginFormClient';
import LoginIllustration from '@/features/auth/components/LoginIllustration';

export default function LoginPage() {
  return (
    <div className="min-h-screen sm:p-6 md:p-8 overflow-y-auto bg-zinc-50 select-none m-0 p-8 leading-6 text-text border-text opacity-100 z-auto flex relative w-[1504px] h-[864px] mt-0 mr-0 mb-0 ml-0 pt-8 pr-8 pb-8 pl-8 flex-row items-center justify-center text-base font-normal text-start border-0 border-solid rounded-none overflow-auto">
      
      {/* Background mesh grid - Original texture requested by user */}
      <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#065f46_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px] z-0 pointer-events-none" />
      
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500/12 blur-[85px] animate-float-1" />
        <div className="absolute -bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[95px] animate-float-2" />
      </div>

      {/* Responsive unified container card */}
      <div
        className="animate-fade-slide-up max-w-[400px] md:max-w-[850px] min-h-[600px] md:h-[650px] z-10 backdrop-blur-md rounded-[32px] outline outline-1 outline-zinc-200/50 shadow-[var(--shadow-xl)] leading-6 tracking-[-0.011em] text-text opacity-100 md:flex-row flex relative w-[850px] h-[650px] m-0 p-0 flex-row items-stretch justify-start text-base font-normal text-start bg-white overflow-hidden">
        
          {/* Small top illustration for mobile only, so screen is not empty but doesn't cause massive scroll */}
          <div className="md:hidden w-full flex bg-gradient-to-b from-emerald-50/20 to-transparent items-center justify-center overflow-hidden py-4 border-b border-zinc-200/40">
            <div className="relative w-[384px] h-[340px] scale-[0.6] origin-top -mb-28">
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
          <div className="w-full md:w-[460px] flex flex-col justify-between p-6 sm:p-8 shrink-0">
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