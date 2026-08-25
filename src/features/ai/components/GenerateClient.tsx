'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MessageSquareText,
  GraduationCap,
  Hash,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react'
import { previewDeckAction, saveDeckAction } from '@/app/ai-actions'
import { CEFR_LEVELS, type CefrLevel } from '@/features/ai/lib/deckGeneration'
import { GenerateMotionItem, GenerateMotionSection } from '@/features/ai/components/GenerateMotion'
import {
  LibraryBadge,
  LibraryPanel,
  accentBadge,
  cardClass,
  ghostBtn,
  iconClass,
  nestedCardClass,
  neutralBadge,
  primaryBtn,
  profileField,
} from '@/features/profile/lib/libraryUi'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { VOICES } from '@/lib/voices'
import {
  generateFrostedSubtle,
  generateFrostedSurface,
} from '@/features/ai/lib/generatePageUi'

const SUGGESTIONS = [
  'Inglês para Medicina',
  'Vocabulário de Marketing',
  'Atendimento ao cliente',
  'Entrevista de emprego',
  'Viagem para Londres',
  'Expressões idiomáticas',
]

const fieldLabel =
  'font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary'

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
  const selectedVoice = VOICES.find((item) => item.id === voice) || VOICES[0]
  const selectedLevel = CEFR_LEVELS.find((item) => item.value === level) || CEFR_LEVELS[0]

  async function handlePreview(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!topic.trim()) return

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
    <div className="space-y-8">
      {success && (
        <LibraryPanel className={`${generateFrostedSurface} flex flex-col gap-4 border-brand-accent bg-brand-accent/15 p-5 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="flex items-start gap-3">
            <span className={`${iconClass} h-11 w-11`}>
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading font-bold text-brand-dark">Pack salvo com sucesso</p>
              <p className="mt-1 font-body text-sm text-brand-secondary">
                A lição foi criada e adicionada à sua rotina.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/home', { transitionTypes: navForwardTransitionTypes })}
            className={`${primaryBtn} text-sm`}
          >
            Ver lições
            <ArrowRight className="h-4 w-4" />
          </button>
        </LibraryPanel>
      )}

      {step === 'form' && (
        <section id="gerar" className="grid gap-5 scroll-mt-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <LibraryPanel className={`${generateFrostedSurface} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <LibraryBadge label="Configuração" />
                <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Novo pack</h2>
              </div>
              <span className={iconClass}>
                <Sparkles className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handlePreview} className="mt-6 space-y-5">
              <div>
                <label htmlFor="topic" className={`mb-2 block ${fieldLabel}`}>
                  Tema ou contexto
                </label>
                <input
                  id="topic"
                  type="text"
                  placeholder="Ex: entrevista de emprego para dev frontend"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  className={`${profileField} text-base font-semibold`}
                  required
                />
              </div>

              <div>
                <label htmlFor="customPrompt" className={`mb-2 flex items-center gap-2 ${fieldLabel}`}>
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Instruções para a IA
                  <span className={neutralBadge}>opcional</span>
                </label>
                <textarea
                  id="customPrompt"
                  placeholder="Ex: Quero frases curtas e informais, focando em gírias americanas usadas no dia a dia. Nível intermediário."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className={`${profileField} resize-none leading-relaxed`}
                />
              </div>

              <div>
                <label htmlFor="packLevel" className={`mb-2 block ${fieldLabel}`}>
                  Nível
                </label>
                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
                  <select
                    id="packLevel"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CefrLevel)}
                    disabled={loading}
                    className={`${profileField} pl-11 font-semibold`}
                  >
                    {CEFR_LEVELS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 font-body text-xs text-brand-secondary">{selectedLevel.hint}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                <div>
                  <label htmlFor="wordCount" className={`mb-2 block ${fieldLabel}`}>
                    Frases
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
                    <input
                      id="wordCount"
                      type="number"
                      min="1"
                      max="50"
                      value={wordCount}
                      onChange={(e) => setWordCount(parseInt(e.target.value) || 10)}
                      disabled={loading}
                      className={`${profileField} pl-11 font-semibold`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="voice" className={`mb-2 block ${fieldLabel}`}>
                    Voz do áudio
                  </label>
                  <select
                    id="voice"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    disabled={loading}
                    className={`${profileField} font-semibold`}
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · {v.meta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className={`mb-2 block ${fieldLabel}`}>Visibilidade</legend>
                <label
                  className={`${nestedCardClass} p-4 transition-all ${packVisibility === 'private' ? 'border-brand-dark bg-brand-accent/20' : generateFrostedSubtle}`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="packVisibility"
                      value="private"
                      checked={packVisibility === 'private'}
                      onChange={() => setPackVisibility('private')}
                      className="mt-1 h-4 w-4 border-brand-dark text-brand-dark focus:ring-brand-accent/40"
                    />
                    <span>
                      <span className="block font-heading text-sm font-bold text-brand-dark">Adicionar privado</span>
                      <span className="mt-1 block font-body text-xs text-brand-secondary">
                        Só você verá este pack no Blitz.
                      </span>
                    </span>
                  </span>
                </label>
                <label
                  className={`${nestedCardClass} p-4 transition-all ${packVisibility === 'public' ? 'border-brand-dark bg-brand-accent/20' : generateFrostedSubtle}`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="packVisibility"
                      value="public"
                      checked={packVisibility === 'public'}
                      onChange={() => setPackVisibility('public')}
                      className="mt-1 h-4 w-4 border-brand-dark text-brand-dark focus:ring-brand-accent/40"
                    />
                    <span>
                      <span className="block font-heading text-sm font-bold text-brand-dark">Adicionar para todos</span>
                      <span className="mt-1 block font-body text-xs text-brand-secondary">
                        Todos os membros poderão usar no Blitz.
                      </span>
                    </span>
                  </span>
                </label>
              </fieldset>

              <div className={`${nestedCardClass} ${generateFrostedSubtle} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-sm font-bold text-brand-dark">Sugestões rápidas</p>
                    <p className="mt-1 font-body text-xs text-brand-secondary">Toque para preencher o tema.</p>
                  </div>
                  <BookOpen className="h-4 w-4 shrink-0 text-brand-dark" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTopic(suggestion)}
                      disabled={loading}
                      className={`${ghostBtn} px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-brand-dark bg-bg-primary px-4 py-3 font-body text-sm font-semibold text-brand-dark">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className={`${primaryBtn} w-full py-3 text-sm`}
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
          </LibraryPanel>

          <aside className="space-y-4">
            <div className={`${cardClass} ${generateFrostedSurface} p-5`}>
              <LibraryBadge label="Resumo" />
              <div className="mt-5 space-y-3">
                <div className={`${nestedCardClass} ${generateFrostedSubtle} flex items-center justify-between gap-4 px-4 py-3`}>
                  <span className="font-body text-sm font-semibold text-brand-secondary">Tema</span>
                  <span className="max-w-40 truncate text-right font-heading text-sm font-bold text-brand-dark">
                    {topic.trim() || 'Não definido'}
                  </span>
                </div>
                {customPrompt.trim() && (
                  <div className={`${nestedCardClass} ${generateFrostedSubtle} px-4 py-3`}>
                    <span className="font-body text-sm font-semibold text-brand-secondary">Instruções</span>
                    <p className="mt-1 line-clamp-3 font-body text-xs leading-relaxed text-brand-dark">
                      {customPrompt.trim()}
                    </p>
                  </div>
                )}
                <div className={`${nestedCardClass} ${generateFrostedSubtle} flex items-center justify-between gap-4 px-4 py-3`}>
                  <span className="font-body text-sm font-semibold text-brand-secondary">Nível</span>
                  <span className="text-right font-heading text-sm font-bold text-brand-dark">{level}</span>
                </div>
                <div className={`${nestedCardClass} ${generateFrostedSubtle} flex items-center justify-between gap-4 px-4 py-3`}>
                  <span className="font-body text-sm font-semibold text-brand-secondary">Frases</span>
                  <span className="font-heading text-sm font-bold text-brand-dark">{wordCount}</span>
                </div>
                <div className={`${nestedCardClass} ${generateFrostedSubtle} flex items-center justify-between gap-4 px-4 py-3`}>
                  <span className="font-body text-sm font-semibold text-brand-secondary">Voz</span>
                  <span className="text-right font-heading text-sm font-bold text-brand-dark">{selectedVoice.name}</span>
                </div>
                <div className={`${nestedCardClass} ${generateFrostedSubtle} flex items-center justify-between gap-4 px-4 py-3`}>
                  <span className="font-body text-sm font-semibold text-brand-secondary">Visibilidade</span>
                  <span className="text-right font-heading text-sm font-bold text-brand-dark">
                    {packVisibility === 'public' ? 'Todos' : 'Privado'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}

      {step === 'preview' && (
        <LibraryPanel className={`${generateFrostedSurface} overflow-hidden`}>
          <div className="border-b-2 border-brand-dark/15 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <LibraryBadge label="Prévia" />
                <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">{topic}</h2>
                <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                  {previewCards.length} frases geradas · {selectedVoice.name} · {selectedVoice.meta}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={loading || saving}
                  className={`${ghostBtn} text-sm`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Ajustar
                </button>
                <button
                  type="button"
                  onClick={() => handlePreview()}
                  disabled={loading || saving}
                  className={`${ghostBtn} text-sm`}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Refazer
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || saving}
                  className={`${primaryBtn} text-sm`}
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
              <div className="mt-5 rounded-xl border-2 border-brand-dark bg-bg-primary px-4 py-3 font-body text-sm font-semibold text-brand-dark">
                {error}
              </div>
            )}
          </div>

          <GenerateMotionSection className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3" stagger>
            {previewCards.map((card, idx) => (
              <GenerateMotionItem key={`${card.en}-${idx}`}>
                <article className={`${nestedCardClass} ${generateFrostedSubtle} p-4 transition-transform hover:-translate-y-0.5`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className={`${accentBadge} inline-flex h-7 min-w-7 items-center justify-center`}>
                      {idx + 1}
                    </span>
                    <span className={neutralBadge}>Card</span>
                  </div>
                  <p className="font-heading text-sm font-bold leading-relaxed text-brand-dark">{card.en}</p>
                  <p className="mt-3 border-t-2 border-brand-dark/15 pt-3 font-body text-sm leading-relaxed text-brand-secondary">
                    {card.pt}
                  </p>
                </article>
              </GenerateMotionItem>
            ))}
          </GenerateMotionSection>
        </LibraryPanel>
      )}
    </div>
  )
}
