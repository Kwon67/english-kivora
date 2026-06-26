'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  MessageSquareText,
  Hash,
  Languages,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react'
import { previewDeckAction, saveDeckAction } from '@/app/ai-actions'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { VOICES } from '@/lib/voices'

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
  const [packVisibility, setPackVisibility] = useState<'private' | 'public'>('public')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [previewCards, setPreviewCards] = useState<{ en: string; pt: string }[]>([])

  const router = useRouter()
  const selectedVoice = VOICES.find((item) => item.id === voice) || VOICES[0]

  async function handlePreview(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await previewDeckAction(topic, wordCount, customPrompt)
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
    setSaving(true)
    setError(null)

    try {
      const result = await saveDeckAction(topic, previewCards, voice, packVisibility)
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
    <div className="mx-auto max-w-6xl space-y-6 pb-8 animate-fade-in">
      <header className="premium-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="stitch-pill bg-primary-container text-[var(--color-on-primary-container)]">
                Admin
              </span>
              <span className="section-kicker">Gerador IA</span>
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight text-text sm:text-4xl">
              Crie packs revisáveis em poucos passos
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
              Gere frases, revise a prévia e salve o pack com áudio antes de liberar para estudo.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[0.85rem] border border-border bg-[var(--color-surface-container-low)] p-3">
                <Wand2 className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-black text-text">Prévia</p>
                <p className="mt-1 text-xs text-text-subtle">Antes de salvar</p>
              </div>
              <div className="rounded-[0.85rem] border border-border bg-[var(--color-surface-container-low)] p-3">
                <Languages className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-black text-text">EN + PT</p>
                <p className="mt-1 text-xs text-text-subtle">Pares de tradução</p>
              </div>
              <div className="rounded-[0.85rem] border border-border bg-[var(--color-surface-container-low)] p-3">
                <Volume2 className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-black text-text">Áudio</p>
                <p className="mt-1 text-xs text-text-subtle">Voz neural</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-[linear-gradient(145deg,var(--color-primary-light),var(--color-secondary-light))] p-5 lg:border-l lg:border-t-0">
            <div className="h-full overflow-hidden rounded-[1rem] border border-border bg-surface-container-lowest/90 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
              <Image
                src="/images/home/undraw-learning-to-sketch.svg"
                alt="Ilustração unDraw de criação de conteúdo"
                width={800}
                height={626}
                unoptimized
                priority
                className="mx-auto h-48 w-full max-w-md object-contain sm:h-56 lg:h-full"
              />
            </div>
          </div>
        </div>
      </header>

      {success && (
        <div className="premium-card flex flex-col gap-4 border-primary/25 bg-primary-light p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-primary text-on-primary">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-text">Pack salvo com sucesso</p>
              <p className="mt-1 text-sm text-text-muted">A lição foi criada e adicionada à sua rotina.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/home', { transitionTypes: navForwardTransitionTypes })}
            className="btn-primary"
          >
            Ver lições
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 'form' && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="premium-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Configuração</p>
                <h2 className="mt-3 text-2xl font-black text-text">Novo pack</h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.85rem] bg-primary-light text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handlePreview} className="mt-6 space-y-5">
              <div>
                <label htmlFor="topic" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-text-subtle">
                  Tema ou contexto
                </label>
                <input
                  id="topic"
                  type="text"
                  placeholder="Ex: entrevista de emprego para dev frontend"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  className="field text-base font-bold"
                  required
                />
              </div>

              <div>
                <label htmlFor="customPrompt" className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-text-subtle">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Instruções para a IA
                  <span className="rounded-md bg-primary-light px-1.5 py-0.5 text-[10px] font-black normal-case tracking-normal text-primary">opcional</span>
                </label>
                <textarea
                  id="customPrompt"
                  placeholder="Ex: Quero frases curtas e informais, focando em gírias americanas usadas no dia a dia. Nível intermediário."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="field resize-none text-sm leading-relaxed"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                <div>
                  <label htmlFor="wordCount" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-text-subtle">
                    Frases
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                    <input
                      id="wordCount"
                      type="number"
                      min="1"
                      max="50"
                      value={wordCount}
                      onChange={(e) => setWordCount(parseInt(e.target.value) || 10)}
                      disabled={loading}
                      className="field pl-11 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="voice" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-text-subtle">
                    Voz do áudio
                  </label>
                  <select
                    id="voice"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    disabled={loading}
                    className="field font-bold"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} · {v.meta}</option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-text-subtle">
                  Visibilidade
                </legend>
                <label className="rounded-[1rem] border border-border bg-[var(--color-surface-container-low)] p-4 text-text transition-all has-[:checked]:border-[var(--color-primary-light)] has-[:checked]:bg-surface-container-lowest">
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="packVisibility"
                      value="private"
                      checked={packVisibility === 'private'}
                      onChange={() => setPackVisibility('private')}
                      className="mt-1 h-4 w-4 border-border text-primary focus:ring-[var(--color-primary)]"
                    />
                    <span>
                      <span className="block text-sm font-black">Adicionar privado</span>
                      <span className="mt-1 block text-xs text-text-muted">Só você verá este pack no Blitz.</span>
                    </span>
                  </span>
                </label>
                <label className="rounded-[1rem] border border-border bg-[var(--color-surface-container-low)] p-4 text-text transition-all has-[:checked]:border-[var(--color-primary-light)] has-[:checked]:bg-surface-container-lowest">
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="packVisibility"
                      value="public"
                      checked={packVisibility === 'public'}
                      onChange={() => setPackVisibility('public')}
                      className="mt-1 h-4 w-4 border-border text-primary focus:ring-[var(--color-primary)]"
                    />
                    <span>
                      <span className="block text-sm font-black">Adicionar para todos</span>
                      <span className="mt-1 block text-xs text-text-muted">Todos os membros poderão usar no Blitz.</span>
                    </span>
                  </span>
                </label>
              </fieldset>

              <div className="rounded-[1rem] border border-border bg-[var(--color-surface-container-low)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-text">Sugestões rápidas</p>
                    <p className="mt-1 text-xs text-text-subtle">Toque para preencher o tema.</p>
                  </div>
                  <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTopic(suggestion)}
                      disabled={loading}
                      className="rounded-[0.7rem] border border-border bg-surface-container-lowest px-3 py-2 text-xs font-black text-text-muted hover:border-[var(--color-border-hover)] hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-[0.85rem] border border-[var(--color-error)]/20 bg-[rgba(186,26,26,0.08)] p-4 text-sm font-semibold text-[var(--color-error)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Gerando prévia
                  </>
                ) : (
                  <>
                    Gerar prévia
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </article>

          <aside className="space-y-4">
            <div className="stitch-panel p-5">
              <p className="section-kicker">Resumo</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-[0.85rem] bg-surface-container-lowest px-4 py-3">
                  <span className="text-sm font-semibold text-text-muted">Tema</span>
                  <span className="max-w-40 truncate text-right text-sm font-black text-text">
                    {topic.trim() || 'Não definido'}
                  </span>
                </div>
                {customPrompt.trim() && (
                  <div className="rounded-[0.85rem] bg-surface-container-lowest px-4 py-3">
                    <span className="text-sm font-semibold text-text-muted">Instruções</span>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-text">
                      {customPrompt.trim()}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 rounded-[0.85rem] bg-surface-container-lowest px-4 py-3">
                  <span className="text-sm font-semibold text-text-muted">Frases</span>
                  <span className="text-sm font-black text-text">{wordCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-[0.85rem] bg-surface-container-lowest px-4 py-3">
                  <span className="text-sm font-semibold text-text-muted">Voz</span>
                  <span className="text-right text-sm font-black text-text">{selectedVoice.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-[0.85rem] bg-surface-container-lowest px-4 py-3">
                  <span className="text-sm font-semibold text-text-muted">Visibilidade</span>
                  <span className="text-right text-sm font-black text-text">
                    {packVisibility === 'public' ? 'Todos' : 'Privado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="premium-card border-border/70 bg-[var(--color-surface-container-low)] p-5 shadow-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] bg-surface-container-lowest text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-black text-text">Saída esperada</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Pack com frases em inglês, tradução em português, áudio e acesso sincronizado com o Blitz.
              </p>
            </div>
          </aside>
        </section>
      )}

      {step === 'preview' && (
        <section className="premium-card overflow-hidden">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="section-kicker">Prévia</p>
                <h2 className="mt-3 text-2xl font-black text-text">{topic}</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {previewCards.length} frases geradas · {selectedVoice.name} · {selectedVoice.meta}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStep('form')}
                  disabled={loading || saving}
                  className="btn-ghost"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Ajustar
                </button>
                <button
                  onClick={() => handlePreview()}
                  disabled={loading || saving}
                  className="btn-ghost"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Refazer
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar pack
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-[0.85rem] border border-[var(--color-error)]/20 bg-[rgba(186,26,26,0.08)] p-4 text-sm font-semibold text-[var(--color-error)]">
                {error}
              </div>
            )}
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {previewCards.map((card, idx) => (
              <article
                key={`${card.en}-${idx}`}
                className="rounded-[0.9rem] border border-border bg-surface-container-lowest p-4 transition-colors hover:border-[var(--color-border-hover)]"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[0.55rem] bg-primary-light px-2 text-xs font-black text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] text-text-subtle">
                    Card
                  </span>
                </div>
                <p className="text-sm font-black leading-relaxed text-text">{card.en}</p>
                <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-text-muted">
                  {card.pt}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
