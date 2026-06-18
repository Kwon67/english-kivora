export type UxAnalyticsEvent =
  | 'wayfinding_glossary_shown'
  | 'wayfinding_glossary_dismissed'
  | 'nav_click'

type UxAnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export function trackUxEvent(event: UxAnalyticsEvent, payload: UxAnalyticsPayload = {}) {
  if (typeof window === 'undefined') return

  const detail = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  }

  window.dispatchEvent(new CustomEvent('kivora:ux', { detail }))

  if (process.env.NODE_ENV === 'development') {
    console.info('[ux]', event, payload)
  }
}