'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react'
import { previewDeckAction, saveDeckAction } from '@/app/ai-actions'
import { CEFR_LEVELS, type CefrLevel } from '@/features/ai/lib/deckGeneration'
import { ghostBtn, primaryBtn } from '@/features/profile/lib/libraryUi'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { VOICES } from '@/lib/voices'
import styles from './Generate.module.css'

const SUGGESTIONS = [
  'Inglês para Medicina',
  'Vocabulário de Marketing',
  'Atendimento ao cliente',
  'Entrevista de emprego',
  'Viagem para Londres',
  'Expressões idiomáticas',
]

function getActionErrorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error) || !err.message) return fallback

  if (err.message.includes('Server Components render')) {
    return fallback
  }

  return err.message
}

export default function GenerateClient() {
  const [topic, setTopic] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [voice, setVoice] = useState<string>(VOICES[0].id)
  const [wordCount, setWordCount] = useState(10)
  const [level, setLevel] = useState<CefrLevel>('A2')
  const [packVisibility, setPackVisibility] = useState<'private' | 'public'>('public')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [previewCards, setPreviewCards] = useState<{ en: string; pt: string }[]>([])

  const router = useRouter()
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)

  useEffect(() => {
    if (previousStep.current !== step) stepHeading.current?.focus()
    previousStep.current = step
  }, [step])
  const selectedVoice = VOICES.find((item) => item.id === voice) || VOICES[0]
  const selectedLevel = CEFR_LEVELS.find((item) => item.value === level) || CEFR_LEVELS[0]

  async function handlePreview(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!topic.trim() || loading || saving) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await previewDeckAction(topic, wordCount, customPrompt, level)
      if (result.success && result.cards) {
        setPreviewCards(result.cards)
        setStep('preview')
      } else if (!result.success) {
        setError(result.error)
      }
    } catch (err: unknown) {
      setError(getActionErrorMessage(err, 'Falha ao gerar a prévia. Tente novamente.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (loading || saving) return
    setSaving(true)
    setError(null)

    try {
      const result = await saveDeckAction(topic, previewCards, voice, packVisibility, level)
      if (result.success) {
        setSuccess(true)
        setStep('form')
        setTopic('')
        setPreviewCards([])
        setPackVisibility('public')
      } else {
        setError(result.error)
      }
    } catch (err: unknown) {
      setError(getActionErrorMessage(err, 'Ocorreu um erro ao salvar o pack. Tente novamente.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {success && (
        <div className={`${styles.section} ${styles.message} ${styles.success}`}>
          <p role="status">Pack salvo com sucesso. A lição foi adicionada à sua rotina.</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={ghostBtn}
              onClick={() => router.push('/home', { transitionTypes: navForwardTransitionTypes })}
            >
              Ver lições <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {step === 'form' ? (
        <section id="gerar" className={styles.section} aria-labelledby="generate-title">
          <h2 id="generate-title" ref={stepHeading} tabIndex={-1}>Novo pack</h2>
          <form onSubmit={handlePreview} className="grid min-w-0 gap-4">
            <label className={styles.field}>
              Tema ou contexto
              <input
                type="text"
                placeholder="Ex: entrevista de emprego para dev frontend"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                required
              />
            </label>
            <details className="workspace-disclosure">
              <summary>Sugestões de tema</summary>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => setTopic(suggestion)} disabled={loading} className={ghostBtn}>
                    {suggestion}
                  </button>
                ))}
              </div>
            </details>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Nível</span>
                <select value={level} onChange={(e) => setLevel(e.target.value as CefrLevel)} disabled={loading} aria-describedby="generate-level-hint">
                  {CEFR_LEVELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                <span id="generate-level-hint" className={styles.hint}>{selectedLevel.hint}</span>
              </label>
              <label className={styles.field}>
                Frases
                <input type="number" min="1" max="50" value={wordCount} onChange={(e) => setWordCount(parseInt(e.target.value) || 10)} disabled={loading} />
              </label>
              <label className={styles.field}>
                Voz do áudio
                <select value={voice} onChange={(e) => setVoice(e.target.value)} disabled={loading}>
                  {VOICES.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.meta}</option>)}
                </select>
              </label>
            </div>
            <details className="workspace-disclosure">
              <summary>Instruções e visibilidade</summary>
              <div className="grid min-w-0 gap-4">
                <label className={styles.field}>
                  Instruções para a IA (opcional)
                  <textarea
                    placeholder="Ex: frases curtas e informais com gírias americanas."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </label>
                <fieldset className="min-w-0" disabled={loading}>
                  <legend className="mb-2 text-sm font-semibold">Visibilidade</legend>
                  <div className={styles.choices}>
                    <label className={styles.option}>
                      <input type="radio" name="packVisibility" value="private" checked={packVisibility === 'private'} onChange={() => setPackVisibility('private')} />
                      <span>Privado <span className={styles.hint}>Só você verá este pack no Blitz.</span></span>
                    </label>
                    <label className={styles.option}>
                      <input type="radio" name="packVisibility" value="public" checked={packVisibility === 'public'} onChange={() => setPackVisibility('public')} />
                      <span>Para todos <span className={styles.hint}>Todos os membros poderão usar no Blitz.</span></span>
                    </label>
                  </div>
                </fieldset>
              </div>
            </details>
            {error && <p className={styles.message} role="alert">{error}</p>}
            <div className={styles.actions}>
              <button type="submit" disabled={loading || !topic.trim()} className={primaryBtn}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Gerando prévia</> : <>Gerar prévia <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            </div>
            {loading && <p className={styles.hint} role="status">Preparando as frases para revisão.</p>}
          </form>
          <details className="workspace-disclosure">
            <summary>Conferir configuração</summary>
            <dl className={styles.summary}>
              <div><dt>Tema</dt><dd>{topic.trim() || 'Não definido'}</dd></div>
              {customPrompt.trim() && <div><dt>Instruções</dt><dd>{customPrompt.trim()}</dd></div>}
              <div><dt>Nível</dt><dd>{level}</dd></div>
              <div><dt>Frases</dt><dd>{wordCount}</dd></div>
              <div><dt>Voz</dt><dd>{selectedVoice.name}</dd></div>
              <div><dt>Visibilidade</dt><dd>{packVisibility === 'public' ? 'Para todos' : 'Privado'}</dd></div>
            </dl>
          </details>
        </section>
      ) : (
        <section className={styles.section} aria-labelledby="generate-preview">
          <div>
            <h2 id="generate-preview" ref={stepHeading} tabIndex={-1}>{topic}</h2>
            <p className={styles.hint}>Prévia · {previewCards.length} frases · {selectedVoice.name} · {selectedVoice.meta}</p>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={handleSave} disabled={loading || saving || !previewCards.length} className={primaryBtn}>
              {saving ? 'Salvando pack' : 'Salvar pack'}
            </button>
            <button type="button" onClick={() => setStep('form')} disabled={loading || saving} className={ghostBtn}>Ajustar</button>
            <button type="button" onClick={() => handlePreview()} disabled={loading || saving} className={ghostBtn}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Refazer
            </button>
          </div>
          {loading && <p className={styles.hint} role="status">Gerando outra prévia.</p>}
          {saving && <p className={styles.hint} role="status">Salvando as frases do pack.</p>}
          {error && <p className={styles.message} role="alert">{error}</p>}
          {previewCards.length ? (
            <ol className={styles.preview}>
              {previewCards.map((card, index) => (
                <li key={`${card.en}-${index}`}>
                  <span aria-hidden="true">{index + 1}.</span>
                  <div>
                    <p lang="en" className="font-semibold">{card.en}</p>
                    <p className={styles.translation}>{card.pt}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className={styles.hint}>A prévia veio sem frases. Use Refazer ou ajuste a configuração.</p>}
        </section>
      )}
    </div>
  )
}
