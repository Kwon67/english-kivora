import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MFAVerification from '@/features/auth/components/MFAVerification'
import LoginIllustration from '@/features/auth/components/LoginIllustration'

type MFAFactor = {
  id: string
  status?: string
}

type UserResponse = {
  data: {
    user: unknown | null
  }
}

type FactorsResponse = {
  data: {
    all: MFAFactor[]
  } | null
  error: unknown | null
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([promise, timeoutPromise])
}

export default async function MFAPage() {
  const supabase = await createClient()

  const userResponse = await withTimeout<UserResponse>(
    supabase.auth.getUser(),
    4000,
    { data: { user: null } }
  ).catch(() => ({ data: { user: null } }))
  const user = userResponse?.data?.user

  if (!user) {
    redirect('/login')
  }

  // Get the MFA factor ID
  const factorsResponse = await withTimeout<FactorsResponse>(
    supabase.auth.mfa.listFactors(),
    3000,
    { data: { all: [] }, error: null }
  ).catch(() => ({ data: { all: [] }, error: null }))

  const factors = factorsResponse?.data
  const error = factorsResponse?.error
  
  if (error || !factors || factors.all.length === 0) {
    // If no factors, but somehow they got here, redirect to home (or enrollment)
    redirect('/home')
  }

  const factor = factors.all.find((f) => f.status === 'verified')
  
  if (!factor) {
    redirect('/home')
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-zinc-50 p-4 select-none sm:p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#065f46_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-float-1 absolute -top-[10%] left-[5%] h-[300px] w-[300px] rounded-full bg-emerald-500/12 blur-[85px]" />
        <div className="animate-float-2 absolute -bottom-[10%] right-[5%] h-[350px] w-[350px] rounded-full bg-amber-500/10 blur-[95px]" />
      </div>

      <div className="animate-slide-up relative z-10 flex min-h-[600px] w-full max-w-[400px] flex-col items-stretch justify-start overflow-hidden rounded-[32px] bg-white/40 shadow-[var(--shadow-xl)] outline outline-1 outline-zinc-200/50 backdrop-blur-md md:h-[650px] md:max-w-[850px] md:flex-row">
        <div className="flex w-full items-center justify-center overflow-hidden border-b border-zinc-200/40 bg-gradient-to-b from-emerald-50/20 to-transparent py-4 md:hidden">
          <div className="relative -mb-28 h-[340px] w-[384px] origin-top scale-[0.6]">
            <LoginIllustration />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col justify-between p-6 sm:p-8 md:w-[460px]">
          <div className="my-auto flex w-full flex-col items-start justify-center">
            <div className="self-stretch pb-6">
              <div className="flex flex-col items-start justify-start gap-1 self-stretch">
                <div className="inline-flex self-stretch items-center justify-center gap-2">
                  <h1 className="text-center font-montserrat text-2xl font-bold leading-8 text-zinc-900">
                    Kivora English
                  </h1>
                </div>
                <div className="flex flex-col items-center self-stretch">
                  <p className="text-center font-inter text-sm leading-6 text-zinc-500">
                    Welcome back! Ready to level up your<br />English?
                  </p>
                </div>
              </div>
            </div>

            <MFAVerification factorId={factor.id} />
          </div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-l border-zinc-200/40 bg-gradient-to-b from-emerald-50/20 to-transparent md:flex">
          <div className="relative h-[529px] w-[384px] origin-center scale-[0.9] lg:scale-100">
            <LoginIllustration />
          </div>
        </div>
      </div>
    </div>
  )
}
