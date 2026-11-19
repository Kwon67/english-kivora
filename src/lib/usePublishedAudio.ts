'use client'
import { useEffect, useState } from 'react'
import catalog from './audioCatalog.json'
import { audioPartition } from './audioPartition'
import type { AudioVoice } from './audioRoles'

type Index = Record<string, string>
const core: Index = catalog.core
const shards: Index = catalog.shards
const cache = new Map<string, Promise<Index>>()
function lookup(text: string | null | undefined, voice: AudioVoice) {
  const key = voice + ':' + (text || '').trim().normalize('NFC')
  const hash = core[key]
  return {
    key,
    url: hash ? '/audio/kivora/' + hash + '.mp3' : null,
    shard: text && !hash ? shards[audioPartition(key)] : undefined,
  }
}
export async function resolvePublishedAudio(text: string, voice: AudioVoice) {
  const { key, url, shard } = lookup(text, voice)
  if (!shard) return url
  let pending = cache.get(shard)
  if (!pending) {
    pending = fetch('/audio/kivora/index/' + shard + '.json', { signal: AbortSignal.timeout(3500) }).then(
      async (r) => {
        if (!r.ok) throw Error('Índice indisponível')
        return (await r.json()) as Index
      },
    )
    cache.set(shard, pending)
  }
  try {
    const hash = (await pending)[key]
    return hash && /^[a-f0-9]{64}$/.test(hash) ? '/audio/kivora/' + hash + '.mp3' : null
  } catch {
    if (cache.get(shard) === pending) cache.delete(shard)
    return null
  }
}
export function usePublishedAudio(text: string | null | undefined, voice: AudioVoice = 'lauren') {
  const { key, url, shard } = lookup(text, voice)
  const [found, setFound] = useState<{ key: string; url: string | null } | null>(null)
  useEffect(() => {
    if (!text || !shard) return
    let active = true
    void resolvePublishedAudio(text, voice).then((url) => {
      if (active) setFound({ key, url })
    })
    return () => {
      active = false
    }
  }, [text, voice, key, shard])
  return { url: url || (found?.key === key ? found.url : null), loading: Boolean(shard && found?.key !== key) }
}
