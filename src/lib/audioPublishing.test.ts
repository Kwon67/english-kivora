import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it, expect } from 'vitest'
import { clipKey, openLedger, reserve } from '../../scripts/audio/ledger'
import { mp3Duration } from '../../scripts/audio/mp3'
import { batchBalance, creditCeiling } from '../../scripts/audio/budget'
import { audioPartition } from './audioPartition'
import catalog from './audioCatalog.json'
import manifest from '../../audio/manifest.json'
import { ELEVENLABS_VOICES, ELEVENLABS_MODEL, type AudioVoice, lessonLines } from './audioRoles'
import { staticAudioUrl } from './staticAudio'
import { TRAVEL_LESSONS } from '@/features/study/lib/travelUnit'

it('protects the account floor and never raises an approved spending ceiling', () => {
  expect(creditCeiling(22000, 31958, 10000)).toBe(21958)
  expect(creditCeiling(22000, 50000, 10000)).toBe(22000)
  expect(creditCeiling(21958, 10001, 10000)).toBe(1)
  expect(creditCeiling(21958, 9999, 10000)).toBe(0)
  expect(creditCeiling(22000, 31000)).toBe(18600)
  expect(() => creditCeiling(22000, NaN, 10000)).toThrow()
})

it('debits the worst case between balance reads and stops when a fresh quote is unavailable', async () => {
  let time = 1,
    calls = 0
  const available = batchBalance(
    async () => {
      calls++
      if (calls > 2) throw Error('Saldo indisponível')
      return 31000 - calls * 100
    },
    () => time,
  )
  expect(await available(120, 10000)).toBe(30900)
  expect(await available(150, 10000)).toBe(30780)
  expect(await available(140, 10000)).toBe(30800)
  expect(calls).toBe(2)
  time += 8000
  await expect(available(1, 10000)).rejects.toThrow('Saldo indisponível')
  await expect(available(1, 10000)).rejects.toThrow('Saldo indisponível')
})

it('matches every published text and speaker to the exact MP3 bytes', () => {
  for (const [key, entry] of Object.entries(manifest)) {
    const voice = entry.voice as AudioVoice
    expect(entry.model).toBe(ELEVENLABS_MODEL)
    expect(entry.voiceId).toBe(ELEVENLABS_VOICES[voice])
    expect(clipKey(entry.text, voice)).toBe(key)
    expect(staticAudioUrl(entry.text, voice)).toBe(entry.path)
    expect(
      createHash('sha256')
        .update(readFileSync('public' + entry.path))
        .digest('hex'),
    ).toBe(entry.sha256)
  }
  expect(staticAudioUrl('Unpublished exercise.')).toBeNull()
})

it('resolves each recording through the client catalog and verifies the complete MP3 frame sequence', () => {
  const core: Record<string, string> = catalog.core
  const shards: Record<string, string> = catalog.shards
  for (const entry of Object.values(manifest)) {
    const key = entry.voice + ':' + entry.text.trim().normalize('NFC')
    let hash = core[key]
    if (!hash) {
      const digest = shards[audioPartition(key)]
      const bytes = readFileSync('public/audio/kivora/index/' + digest + '.json')
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(digest)
      hash = JSON.parse(bytes.toString('utf8'))[key]
    }
    expect(hash).toBe(entry.sha256)
    const audio = readFileSync('public' + entry.path)
    expect(mp3Duration(audio)).toBeGreaterThan(0)
    expect(() => mp3Duration(audio.subarray(0, audio.length - 1))).toThrow()
  }
})

it('keeps each line of the hotel dialogue with its original speaker', () => {
  const hotel = TRAVEL_LESSONS[1]
  const lines = lessonLines(hotel.id, hotel.text)
  expect(lines.map((l) => l.voice)).toEqual(['lauren', 'jarnathan', 'lauren'])
  expect(lines.map((l) => l.speaker + ': ' + l.text).join(' ')).toBe(hotel.text)
})

it('coordinates independent writers, preserves uncertain reservations on restart and caps total costs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'kivora-audio-'))
  const file = join(directory, 'ledger.sqlite')
  const first = openLedger(file)
  const second = openLedger(file)
  try {
    expect(reserve(first, 'a', 8, 10)).toBe(true)
    expect(reserve(second, 'a', 8, 10)).toBe(false)
    expect(() => reserve(second, 'b', 2, 10)).toThrow(/reserva/)
    second.prepare('update jobs set credits=6 where key=?').run('a')
    expect(() => reserve(second, 'c', 5, 20)).toThrow(/Limite/)
    expect(reserve(second, 'b', 4, 20)).toBe(true)
    const reopened = openLedger(file)
    try {
      expect(reserve(reopened, 'b', 4, 20)).toBe(false)
    } finally {
      reopened.close()
    }
  } finally {
    first.close()
    second.close()
    rmSync(directory, { recursive: true })
  }
})

it('only credits settled receipts when the provider independently confirms every voice total', async () => {
  const { matchesUsage, receiptTotals } = await import('../../scripts/audio/reconcile')
  const job = { key: 'a', receipt: 'one', credits: 15 }
  const voices = new Map([['a', 'Lauren']])
  const costs = receiptTotals([job], voices, 15)
  expect(matchesUsage(costs, { Lauren: [6, 9] })).toBe(true)
  expect(matchesUsage(costs, { Lauren: [6], Siren: [9] })).toBe(false)
  expect(matchesUsage(costs, {})).toBe(false)
  expect(() => receiptTotals([job, job], voices, 30)).toThrow()
  expect(() => receiptTotals([{ ...job, credits: null }], voices, 15)).toThrow()
  expect(() => receiptTotals([job], voices, 19)).toThrow()
})
