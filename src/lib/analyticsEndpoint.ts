const defaultEndpoint = 'https://us.i.posthog.com'

export function resolveAnalyticsEndpoint(configuredHost?: string) {
  const host = configuredHost?.trim() || defaultEndpoint
  try {
    const url = new URL(host, 'https://kivora.invalid')
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null

    if (host.startsWith('/') && !host.startsWith('//') && url.origin === 'https://kivora.invalid') {
      return { apiHost: url.pathname, origin: null }
    }

    if (!/^https:\/\//i.test(host) || !/^(?:[a-z0-9.-]+|\[[a-f0-9:]+\])$/i.test(url.hostname)) return null
    return { apiHost: url.href.replace(/\/$/, ''), origin: url.origin }
  } catch {
    return null
  }
}
