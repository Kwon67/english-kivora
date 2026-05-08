'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2, Sparkles, Loader2, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { generateDeckAction } from '@/app/ai-actions'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export default function GeneratePage() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await generateDeckAction(topic)
      if (result.success) {
        setSuccess(true)
        setTopic('')
        // Opcional: redirecionar após um tempo ou deixar o usuário ver a mensagem de sucesso
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8 animate-fade-in">
      <header className="premium-card p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="h-32 w-32 text-[var(--color-primary)]" />
        </div>
        
        <div className="relative z-10">
          <p className="section-kicker">Inteligência Artificial</p>
          <h1 className="mt-4 text-4xl font-extrabold text-[var(--color-text)]">Gerador de Decks</h1>
          <p className="mt-4 max-w-xl text-base text-[var(--color-text-muted)] leading-relaxed">
            Crie materiais de estudo personalizados instantaneamente. Digite um tema, profissão ou situação e nossa IA preparará frases relevantes para o seu nível.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <article className="premium-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-[var(--color-primary)]" />
            O que você quer aprender?
          </h2>
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="topic" className="block text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-2">
                Tema ou Contexto
              </label>
              <input
                id="topic"
                type="text"
                placeholder="Ex: Entrevista de emprego, Viagem para Londres, Programação Java..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-5 py-4 font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all shadow-sm"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-[rgba(186,26,26,0.08)] p-4 text-sm font-semibold text-[var(--color-error)] border border-[var(--color-error)]/20">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-[rgba(70,98,89,0.1)] p-4 text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Deck gerado com sucesso! Ele já está disponível na sua Home.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando conteúdo...
                </>
              ) : (
                <>
                  Gerar Deck com IA
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
                'Expressões idiomáticas',
                'Phrasal Verbs essenciais',
                'Inglês para Designers'
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
              Nossa IA analisa o tema e gera frases naturais com traduções precisas. O novo deck é salvo nos seus pacotes e uma nova tarefa é criada para você começar a praticar imediatamente.
            </p>
          </div>
        </aside>
      </section>

      {success && (
        <div className="flex justify-center pt-4">
          <button 
            onClick={() => router.push('/home', { transitionTypes: navForwardTransitionTypes })}
            className="btn-ghost !bg-[var(--color-surface-container-low)]"
          >
            Ver minhas lições
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
