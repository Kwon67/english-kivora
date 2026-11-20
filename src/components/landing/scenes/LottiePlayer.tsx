'use client'

import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react'

setWasmUrl(new URL('@lottiefiles/dotlottie-web/dotlottie-player.wasm', import.meta.url).href)
export default function LottiePlayer({ src }: { src: string }) {
  return <DotLottieReact src={src} autoplay loop />
}
