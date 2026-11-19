// MSE support for raw MP3 varies by browser. Unsupported devices receive the
// same POST response as a blob, without issuing a second synthesis request.
export function attachProgressiveAudio(response: Response, signal: AbortSignal) {
  if (typeof MediaSource === 'undefined' || !MediaSource.isTypeSupported('audio/mpeg') || !response.body)
    return null
  const media = new MediaSource()
  const url = URL.createObjectURL(media)
  const reader = response.body.getReader()
  const stop = () => {
    void reader.cancel().catch(() => undefined)
  }
  signal.addEventListener('abort', stop, { once: true })
  media.addEventListener(
    'sourceopen',
    async () => {
      try {
        if (signal.aborted) return
        const buffer = media.addSourceBuffer('audio/mpeg')
        while (!signal.aborted) {
          const { done, value } = await reader.read()
          if (done) break
          await new Promise<void>((resolve, reject) => {
            const cleanup = () => {
              buffer.removeEventListener('updateend', end)
              buffer.removeEventListener('error', fail)
              signal.removeEventListener('abort', fail)
            }
            const end = () => {
              cleanup()
              resolve()
            }
            const fail = () => {
              cleanup()
              reject(Error('Áudio interrompido.'))
            }
            buffer.addEventListener('updateend', end, { once: true })
            buffer.addEventListener('error', fail, { once: true })
            signal.addEventListener('abort', fail, { once: true })
            try {
              buffer.appendBuffer(new Uint8Array(value))
            } catch {
              fail()
            }
          })
        }
        if (media.readyState === 'open' && !buffer.updating) media.endOfStream()
      } catch {
        stop()
        if (media.readyState === 'open') {
          try {
            media.endOfStream('network')
          } catch {
            /* Element closed during navigation. */
          }
        }
      } finally {
        signal.removeEventListener('abort', stop)
        reader.releaseLock()
      }
    },
    { once: true },
  )
  return url
}
