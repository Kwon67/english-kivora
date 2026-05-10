'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2, Sparkles, Loader2, ArrowRight, BookOpen, CheckCircle2, RotateCcw, Save } from 'lucide-react'
import { previewDeckAction, saveDeckAction } from '@/app/ai-actions'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

const VOICES = [
  { id: 'en-US-AriaNeural', name: 'Aria (EUA, Feminina)' },
  { id: 'en-US-GuyNeural', name: 'Guy (EUA, Masculino)' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (Reino Unido, Feminina)' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (Reino Unido, Masculino)' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha (Austrália, Feminina)' },
  { id: 'en-AU-WilliamNeural', name: 'William (Austrália, Masculino)' },
]

export default function GeneratePage() {
  const [topic, setTopic] = useState('')
  const [voice, setVoice] = useState(VOICES[0].id)
  const [wordCount, setWordCount] = useState(10)
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [previewCards, setPreviewCards] = useState<{ en: string; pt: string }[]>([])
  
  const router = useRouter()

  async function handlePreview(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await previewDeckAction(topic, wordCount)
      if (result.success && result.cards) {
        setPreviewCards(result.cards)
        setStep('preview')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const result = await saveDeckAction(topic, previewCards, voice)
      if (result.success) {
        setSuccess(true)
        setStep('form')
        setTopic('')
        setPreviewCards([])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o pack.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8 animate-fade-in">
      <header className="premium-card p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="h-32 w-32 text-[var(--color-primary)]" />
        </div>
        
        <div className="relative z-10">
          <p className="section-kicker">Admin Only - Inteligência Artificial</p>
          <h1 className="mt-4 text-4xl font-extrabold text-[var(--color-text)]">Gerador de Decks</h1>
          <p className="mt-4 max-w-xl text-base text-[var(--color-text-muted)] leading-relaxed">
            Crie materiais de estudo personalizados instantaneamente. Configure as opções abaixo, gere uma prévia e decida se quer salvar o pack.
          </p>
        </div>
      </header>

      {success && (
        <div className="rounded-xl bg-[rgba(70,98,89,0.1)] p-6 text-base font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            Deck gerado e salvo com sucesso! Os áudios foram transcritos.
          </div>
          <button 
            onClick={() => router.push('/home', { transitionTypes: navForwardTransitionTypes })}
            className="btn-ghost mt-2 !bg-[var(--color-surface-container-low)]"
          >
            Ver minhas lições
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 'form' && (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="premium-card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-[var(--color-primary)]" />
              Configurar Novo Pack
            </h2>
            
            <form onSubmit={handlePreview} className="mt-6 space-y-4">
              <div>
                <label htmlFor="topic" className="block text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-2">
                  Tema ou Contexto
                </label>
                <input
                  id="topic"
                  type="text"
                  placeholder="Ex: Entrevista de emprego, Viagem para Londres..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-5 py-4 font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wordCount" className="block text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-2">
                    Quantidade de Frases
                  </label>
                  <input
                    id="wordCount"
                    type="number"
                    min="1"
                    max="50"
                    value={wordCount}
                    onChange={(e) => setWordCount(parseInt(e.target.value) || 10)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-5 py-4 font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label htmlFor="voice" className="block text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-2">
                    Voz do Áudio (Edge TTS)
                  </label>
                  <select
                    id="voice"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-5 py-4 font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all shadow-sm"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-[rgba(186,26,26,0.08)] p-4 text-sm font-semibold text-[var(--color-error)] border border-[var(--color-error)]/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl active:scale-95 transition-all mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Gerando Prévia...
                  </>
                ) : (
                  <>
                    Gerar Prévia do Pack
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </article>

          <aside className="space-y-4">
            <div className="stitch-panel p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-subtle)]">Sugestões</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Inglês para Medicina',
                  'Vocabulário de Marketing',
                  'Atendimento ao cliente',
                  'Expressões idiomáticas'
                ].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => setTopic(sug)}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg bg-[var(--color-surface-container-low)] text-xs font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="premium-card p-6 bg-[var(--color-surface-container-low)] border-none shadow-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text)]">Como funciona?</h3>
              <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                Você escolhe o tema, a quantidade de palavras e a voz. Nós geramos uma prévia com os itens. Se você não gostar, pode refazer antes de salvar definitivamente e gerar os áudios.
              </p>
            </div>
          </aside>
        </section>
      )}

      {step === 'preview' && (
        <section className="space-y-6">
          <div className="premium-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">Prévia do Pack: {topic}</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {previewCards.length} frases geradas. Revise antes de salvar e gerar áudios com a voz selecionada.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview()}
                  disabled={loading || saving}
                  className="btn-ghost flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Refazer
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Pack Definitivo
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-[rgba(186,26,26,0.08)] p-4 text-sm font-semibold text-[var(--color-error)] border border-[var(--color-error)]/20 mb-6">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {previewCards.map((card, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] flex flex-col gap-2">
                  <p className="text-sm font-bold text-[var(--color-text)]">{card.en}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{card.pt}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setStep('form')}
                disabled={loading || saving}
                className="btn-ghost"
              >
                Voltar às opções
              </button>
              <button
                onClick={handleSave}
                disabled={loading || saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando e gerando áudios...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Pack Definitivo
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

