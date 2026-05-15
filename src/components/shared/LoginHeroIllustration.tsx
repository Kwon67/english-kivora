'use client'

import Script from 'next/script'

export default function LoginHeroIllustration() {
  return (
    <>
      <Script 
        src="https://cdn.lordicon.com/lordicon.js" 
        strategy="afterInteractive" 
      />
      <div className="flex items-center justify-center w-full aspect-square max-w-[400px] mx-auto">
        {/* @ts-ignore - lord-icon is a custom element from Lordicon script */}
        <lord-icon
          src="https://cdn.lordicon.com/rjzlnunf.json"
          trigger="loop"
          delay="1500"
          colors="primary:#ffffff,secondary:#f4bd75"
          stroke="bold"
          state="hover-line"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </>
  )
}
