'use client'

import LoginForm from '@/features/auth/components/LoginForm'
import LoginIllustration from '@/features/auth/components/LoginIllustration'
import { m } from 'framer-motion'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 overflow-hidden bg-zinc-50 dark:bg-stone-950">
      
      {/* Background mesh grid - Original texture requested by user */}
      <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#00A85F_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px] z-0" />
      
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500/12 dark:bg-emerald-400/8 blur-[85px] animate-float-1" />
        <div className="absolute -bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-amber-500/10 dark:bg-amber-400/6 blur-[95px] animate-float-2" />
      </div>

      {/* Main Card Container */}
      <m.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[900px] min-h-[600px] relative z-10 flex flex-col md:flex-row bg-white dark:bg-zinc-900 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-zinc-200 dark:outline-zinc-800 shadow-[0_20px_60px_rgba(24,32,29,0.08)] overflow-hidden"
      >
        {/* Left Side - Form Area */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm">
             {/* Branding Header */}
             <div className="mb-8 w-full flex flex-col items-center">
                <div className="mb-2">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="#00A85F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="#00A85F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                </div>
                <h1 className="text-2xl font-bold font-montserrat text-zinc-900 dark:text-white mb-2 leading-8">Kivora English</h1>
                <p className="text-base text-zinc-500 dark:text-zinc-400 text-center leading-6 font-inter">Welcome back! Ready to level up your<br />English?</p>
             </div>
             
             {/* Functional Login Form with new styling */}
             <LoginForm />
          </div>
        </div>

        {/* Right Side - Illustration Area */}
        <div className="hidden md:flex w-1/2 relative bg-emerald-50/30 dark:bg-emerald-950/20 overflow-hidden items-center justify-center border-l border-zinc-100 dark:border-zinc-800">
           {/* Wrap illustration in its expected coordinate space and scale down slightly if needed to fit */}
           <div className="relative w-[384px] h-[500px] scale-90 lg:scale-100 origin-center -mt-16">
             <LoginIllustration />
           </div>
        </div>
      </m.div>
    </div>
  )
}
