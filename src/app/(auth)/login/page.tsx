import Image from 'next/image'
import LoginForm from '@/features/auth/components/LoginForm'

const loginHighlights = [
  { label: 'SRS', value: 'Revisão inteligente' },
  { label: 'Arena', value: 'Ritmo competitivo' },
  { label: 'Voz', value: 'Prática guiada' },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[minmax(0,1.15fr)_minmax(26rem,0.85fr)] overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      
      {/* Left Column: Premium Brand Visuals (Desktop only, hidden on mobile/tablet) */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_22%_14%,rgba(244,189,117,0.36),transparent_25%),radial-gradient(circle_at_78%_80%,rgba(255,255,255,0.18),transparent_26%),linear-gradient(145deg,#12352e_0%,#276356_50%,#233f3b_100%)] p-12 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(7,24,21,0.16),rgba(7,24,21,0.58))]" />
        
        {/* Decorative elements */}
        <div className="absolute left-12 top-24 h-40 w-px bg-gradient-to-b from-transparent via-white/34 to-transparent" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full border border-white/12" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-black/12 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-9 flex items-center justify-center bg-white/12 rounded-xl border border-white/14 backdrop-blur-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="#00A85F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="font-montserrat text-2xl font-bold tracking-tight">Kivora English</div>
        </div>

        {/* Center Illustration & Copy */}
        <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 py-10">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-md">
              Treino diário premium
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white xl:text-6xl">
              Inglês que parece ritual, não tarefa.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/80">
              Uma rotina visualmente limpa para revisar no momento certo, treinar fala e escuta, disputar desafios e enxergar progresso real.
            </p>
          </div>

          {/* Undraw illustration with premium shadow */}
          <div className="relative w-full max-w-[28rem] mx-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.22)] animate-fade-in">
            <Image
              src="/images/login/undraw-login.svg"
              alt="Login illustration"
              width={480}
              height={320}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        {/* Footer highlights */}
        <div className="relative z-10 grid gap-px overflow-hidden rounded-[1rem] border border-white/14 bg-white/14 text-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-md sm:grid-cols-3">
          {loginHighlights.map((item) => (
            <div key={item.label} className="bg-white/8 p-4 text-center">
              <p className="text-lg font-black text-white">{item.label}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Right/Center Column: Card Form Area (100% responsive and centered) */}
      <section className="relative flex min-h-screen items-center justify-center p-4 sm:p-6" style={{ background: 'var(--color-bg)' }}>
        
        {/* Background mesh grid */}
        <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-primary)_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px]" />
        
        {/* Mockup Card */}
        <div
          data-layer="Html → Body"
          className="HtmlBody w-full max-w-[420px] min-h-[820px] px-6 py-10 relative flex justify-center items-center rounded-2xl shadow-[var(--shadow-lg)] transition-all"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div data-layer="Main Container" className="MainContainerSplitLayoutForDesktopSingleColumnForMobile flex-1 inline-flex flex-col justify-start items-start w-full" style={{ background: 'var(--color-card)' }}>
            <div data-layer="Left Side - Form Area" className="LeftSideFormArea self-stretch flex flex-col justify-center items-start w-full">
              
              {/* Branding header inside card */}
              <div data-layer="Branding:margin" className="BrandingMargin self-stretch pb-10 flex flex-col justify-start items-start w-full">
                <div data-layer="Branding" className="Branding self-stretch flex flex-col justify-start items-start gap-2 w-full">
                  <div data-layer="Heading 1" className="Heading1 self-stretch inline-flex justify-center items-center gap-2 w-full">
                    <div data-layer="Container" className="Container inline-flex flex-col justify-start items-center">
                      <div data-svg-wrapper data-layer="book-open" className="BookOpen relative">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="#00A85F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="#00A85F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <div data-layer="Kivora English" className="KivoraEnglish text-center justify-center text-2xl font-bold font-montserrat leading-8" style={{ color: 'var(--color-text)' }}>
                      Kivora English
                    </div>
                  </div>
                  <div data-layer="Container" className="Container self-stretch flex flex-col justify-start items-center w-full">
                    <div data-layer="Text" className="Text text-center justify-center text-base font-normal font-inter leading-6" style={{ color: 'var(--color-text-muted)' }}>
                      Welcome back! Ready to level up your<br />English?
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Form component */}
              <div data-layer="Login Form:margin" className="LoginFormMargin self-stretch pb-4 flex flex-col justify-start items-start w-full">
                <LoginForm />
              </div>

            </div>
          </div>
        </div>

      </section>
    </div>
  )
}
