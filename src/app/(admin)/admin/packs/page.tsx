'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createPack, deletePack, createCard, deleteCard } from '@/app/actions'
import type { Pack, Card } from '@/types/database.types'
import { Package, Plus, X, Trash2, Loader2, BookOpen } from 'lucide-react'

export default function PacksPage() {
  const [packs, setPacks] = useState<(Pack & { cards: Card[] })[]>([])
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [showNewPack, setShowNewPack] = useState(false)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function loadPacks() {
    const { data } = await supabase
      .from('packs')
      .select('*, cards(*)')
      .order('created_at', { ascending: false })

    if (data) setPacks(data as (Pack & { cards: Card[] })[])
  }

  useEffect(() => {
    loadPacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreatePack(formData: FormData) {
    startTransition(async () => {
      const result = await createPack(formData)
      if (result?.success) {
        setShowNewPack(false)
        loadPacks()
      }
    })
  }

  async function handleDeletePack(id: string) {
    if (!confirm('Tem certeza? Isso apagará todos os cards do pack.')) return
    startTransition(async () => {
      await deletePack(id)
      setSelectedPack(null)
      loadPacks()
    })
  }

  async function handleCreateCard(formData: FormData) {
    startTransition(async () => {
      const result = await createCard(formData)
      if (result?.success) loadPacks()
    })
  }

  async function handleDeleteCard(id: string) {
    startTransition(async () => {
      await deleteCard(id)
      loadPacks()
    })
  }

  const activePack = packs.find((p) => p.id === selectedPack)

  const difficultyConfig: Record<string, { label: string; className: string }> = {
    easy: { label: 'Fácil', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    medium: { label: 'Médio', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    hard: { label: 'Difícil', className: 'bg-red-50 text-red-700 border border-red-200' },
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Package className="w-6 h-6 text-[var(--color-primary)]" strokeWidth={2} />
            <h1 className="font-bold tracking-tight text-3xl text-[var(--color-text)]">
              Gerenciador de Packs
            </h1>
          </div>
          <p className="mt-1 text-[var(--color-text-muted)] text-sm">Crie e organize as lições dos seus alunos.</p>
        </div>
        <button
          onClick={() => setShowNewPack(!showNewPack)}
          className="btn-primary cursor-pointer"
        >
          {showNewPack ? (
            <><X className="w-4 h-4" strokeWidth={2} /> Fechar</>
          ) : (
            <><Plus className="w-4 h-4" strokeWidth={2} /> Novo Pack</>
          )}
        </button>
      </div>

      {/* New pack form */}
      {showNewPack && (
        <form
          action={handleCreatePack}
          className="card p-6 space-y-4 animate-slide-up"
        >
          <h3 className="font-semibold text-lg text-[var(--color-text)]">Criar Novo Pack</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nome do pack (ex: Saudações e Cumprimentos)"
              required
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
            />
            <select
              name="difficulty"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
            >
              <option value="">Dificuldade (opcional)</option>
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <input
            name="description"
            placeholder="Descrição curta (opcional)"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
          />
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary py-3 cursor-pointer"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                'Confirmar Criação'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowNewPack(false)}
              className="btn-ghost cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Packs grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack, i) => {
          const difficulty = difficultyConfig[pack.level || ''] || { label: 'Nível —', className: 'bg-slate-100 text-slate-500 border border-slate-200' }

          return (
            <div
              key={pack.id}
              onClick={() => setSelectedPack(pack.id === selectedPack ? null : pack.id)}
              className={`card cursor-pointer p-5 transition-all duration-200 animate-slide-up ${
                pack.id === selectedPack
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 shadow-md'
                  : ''
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] flex items-center justify-center">
                  <Package className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <span className={`badge text-[11px] ${difficulty.className}`}>
                  {difficulty.label}
                </span>
              </div>
              <h3 className="font-bold text-lg text-[var(--color-text)] tracking-tight">{pack.name}</h3>
              {pack.description && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">{pack.description}</p>
              )}
              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--color-text-subtle)]">
                  {pack.cards?.length || 0} cards
                </p>
                <span className="text-xs font-medium text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Editar →
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected pack detail */}
      {activePack && (
        <div className="card p-6 space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                <Package className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
                  {activePack.name}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">Adicione ou remova vocabulário deste pack.</p>
              </div>
            </div>
            <button
              onClick={() => handleDeletePack(activePack.id)}
              className="btn-ghost text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Excluir Pack
            </button>
          </div>

          {/* Add card form */}
          <div className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] p-5 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] mb-3">Adicionar Novo Vocabulário</h4>
            <form
              action={handleCreateCard}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input type="hidden" name="pack_id" value={activePack.id} />
              <input
                name="en"
                placeholder="Frase em Inglês (ex: How are you?)"
                required
                className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
              <input
                name="pt"
                placeholder="Tradução em Português"
                required
                className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
              <input type="hidden" name="order_index" value="0" />
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary cursor-pointer whitespace-nowrap"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Salvar</>}
              </button>
            </form>
          </div>

          {/* Cards list */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Cards no Pack</h4>
            <div className="space-y-2">
              {activePack.cards
                ?.sort((a: Card, b: Card) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((card: Card, idx: number) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)] group animate-slide-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-[var(--color-text-subtle)] tabular-nums w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <span className="font-semibold text-[var(--color-text)]">
                          {card.english_phrase || card.en}
                        </span>
                        <span className="hidden sm:block text-[var(--color-border)]">→</span>
                        <span className="text-[var(--color-text-muted)] text-sm">{card.portuguese_translation || card.pt}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-error)] hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
            </div>
            {(!activePack.cards || activePack.cards.length === 0) && (
              <div className="text-center py-10 border-2 border-dashed border-[var(--color-border)] rounded-xl">
                <BookOpen className="w-8 h-8 text-[var(--color-text-subtle)] mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-[var(--color-text-muted)]">Pack vazio. Comece a adicionar frases acima!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
