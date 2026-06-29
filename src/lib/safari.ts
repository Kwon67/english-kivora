/** True on iOS Safari and other WebKit browsers on iPhone/iPad (incl. in-app webviews). */
export function isIOSWebKit(): boolean {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent
  const isClassicIOS = /iPad|iPhone|iPod/i.test(ua)
  const isIPadOS =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1

  return isClassicIOS || isIPadOS
}

export function hasIOSWebKitFlag(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.ios === '1'
}