'use client'

import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  createPack, 
  deletePack, 
  createCard, 
  deleteCard, 
  importPackWithCards, 
  updateCard,
  updatePack
} from '@/app/actions'
import { parseBulkImport, parseJsonImport, parseApkg } from '@/lib/apkgParser'
import type { Pack, Card } from '@/types/database.types'
import { 
  Package, 
  Plus, 
  X, 
  Trash2, 
  Loader2, 
  BookOpen, 
  Upload, 
  FileText,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function PacksPage() {
  const [packs, setPacks] = useState<(Pack & { cards: Card[] })[]>([])
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [showNewPack, setShowNewPack] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [importPreview, setImportPreview] = useState<{ name: string; description?: string; level?: 'easy' | 'medium' | 'hard'; cards: { en: string; pt: string }[]; source: string } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ en: '', pt: '' })
  const [editingPack, setEditingPack] = useState<string | null>(null)
  const [packEditForm, setPackEditForm] = useState({ name: '', description: '', level: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function loadPacks() {
    const supabase = createClient()
    const { data } = await supabase
      .from('packs')
      .select('*, cards(*)')
      .order('created_at', { ascending: false })

    if (data) setPacks(data as (Pack & { cards: Card[] })[])
  }

  useEffect(() => {
    loadPacks()
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

  async function handleUpdateCard(cardId: string) {
    startTransition(async () => {
      const result = await updateCard(cardId, editForm)
      if (result?.success) {
        setEditingCard(null)
        setEditForm({ en: '', pt: '' })
        loadPacks()
      }
    })
  }

  async function handleUpdatePack(packId: string) {
    if (!packEditForm.name) return
    
    const formData = new FormData()
    formData.append('name', packEditForm.name)
    formData.append('description', packEditForm.description)
    formData.append('difficulty', packEditForm.level)
    
    startTransition(async () => {
      const result = await updatePack(packId, formData)
      if (result?.success) {
        setEditingPack(null)
        loadPacks()
      }
    })
  }

  const handleFileImport = useCallback(async (file: File) => {
    setImportLoading(true)
    setImportError(null)
    setImportPreview(null)

    try {
      const ext = file.name.toLowerCase()
      
      if (ext.endsWith('.apkg')) {
        const result = await parseApkg(file)
        setImportPreview({
          name: result.deckName,
          description: result.description,
          level: 'medium',
          cards: result.cards.map((c: { front: string; back: string }) => ({ en: c.front, pt: c.back })),
          source: 'apkg'
        })
      } else if (ext.endsWith('.json')) {
        const text = await file.text()
        const result = parseJsonImport(text)
        if (result) {
          setImportPreview({
            name: result.name,
            cards: result.cards.map((c: { front: string; back: string; en?: string; pt?: string }) => ({ 
          en: c.en || c.front || '', 
          pt: c.pt || c.back || '' 
        })),
            level: 'medium',
            source: 'json'
          })
        } else {
          setImportError('Formato JSON inválido')
        }
      } else if (ext.endsWith('.csv') || ext.endsWith('.txt')) {
        const text = await file.text()
        const cards = parseBulkImport(text)
        setImportPreview({
          name: file.name.replace(/\.[^/.]+$/, ''),
          cards: cards.map((c: { en?: string; pt?: string; front?: string; back?: string }) => ({ 
          en: c.en || c.front || '', 
          pt: c.pt || c.back || '' 
        })),
          level: 'medium',
          source: ext.endsWith('.csv') ? 'csv' : 'text'
        })
      } else {
        setImportError('Formato de arquivo não suportado. Use .apkg, .json, .csv ou .txt')
      }
    } catch (error) {
      setImportError('Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setImportLoading(false)
    }
  }, [])

  const handleTextImport = useCallback(() => {
    const text = textareaRef.current?.value || ''
    if (!text.trim()) {
      setImportError('Cole o texto para importar')
      return
    }

    const cards = parseBulkImport(text)
    if (cards.length === 0) {
      setImportError('Nenhum card encontrado. Use formato: Inglês | Português')
      return
    }

    setImportPreview({
      name: 'Pack Importado',
      cards: cards.map(c => ({ en: c.front, pt: c.back })),
      level: 'medium',
      source: 'text'
    })
    setImportError(null)
  }, [])

  async function confirmImport() {
    if (!importPreview) return

    startTransition(async () => {
      const result = await importPackWithCards({
        name: importPreview.name,
        description: importPreview.description,
        level: importPreview.level,
        cards: importPreview.cards
      })

      if (result?.success) {
        setImportPreview(null)
        setShowImport(false)
        loadPacks()
        alert(`Pack criado com sucesso! ${result.cardCount} cards importados.`)
      } else if (result?.error) {
        setImportError(result.error)
      }
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
          <p className="mt-1 text-[var(--color-text-muted)] text-sm">
            Crie packs manualmente ou importe de arquivos APKG, JSON, CSV.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(!showImport)}
            className={`btn-ghost cursor-pointer ${showImport ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : ''}`}
          >
            <Upload className="w-4 h-4" strokeWidth={2} /> 
            {showImport ? 'Fechar Import' : 'Importar'}
          </button>
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

      {/* Import Section */}
      {showImport && (
        <div className="card p-6 space-y-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
              <Upload className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[var(--color-text)]">Importar Pack</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Suporte a APKG (Anki), JSON, CSV ou texto
              </p>
            </div>
          </div>

          {!importPreview ? (
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/10 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".apkg,.json,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileImport(file)
                  }}
                />
                <Upload className="w-10 h-10 text-[var(--color-text-subtle)] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-[var(--color-text)] mb-1">
                  Clique para fazer upload
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  APKG (Anki), JSON, CSV ou TXT
                </p>
              </div>

              {/* Text Import */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  Ou cole o texto diretamente:
                </label>
                <textarea
                  ref={textareaRef}
                  placeholder="Hello | Olá&#10;How are you? | Como vai?&#10;..."
                  className="w-full h-32 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 text-sm font-mono"
                />
                <button
                  onClick={handleTextImport}
                  disabled={importLoading}
                  className="btn-ghost text-sm w-full cursor-pointer"
                >
                  {importLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Analisar Texto</>
                  )}
                </button>
              </div>

              {/* Error */}
              {importError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {importError}
                </div>
              )}
            </div>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-[var(--color-text)]">
                  Preview: {importPreview.name}
                </h4>
                <button
                  onClick={() => setImportPreview(null)}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Cancelar
                </button>
              </div>

              {/* Pack Settings */}
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={importPreview.name}
                  onChange={(e) => setImportPreview({ ...importPreview, name: e.target.value })}
                  placeholder="Nome do pack"
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                />
                <input
                  value={importPreview.description || ''}
                  onChange={(e) => setImportPreview({ ...importPreview, description: e.target.value })}
                  placeholder="Descrição"
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                />
                <select
                  value={importPreview.level}
                  onChange={(e) => setImportPreview({ ...importPreview, level: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              {/* Cards Preview */}
              <div className="bg-[var(--color-surface-hover)] rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                  {importPreview.cards.length} cards encontrados
                </p>
                <div className="space-y-1">
                  {importPreview.cards.slice(0, 10).map((card, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-[var(--color-text-subtle)] w-6">{i + 1}</span>
                      <span className="font-medium text-[var(--color-text)]">{card.en}</span>
                      <span className="text-[var(--color-text-subtle)]">→</span>
                      <span className="text-[var(--color-text-muted)]">{card.pt}</span>
                    </div>
                  ))}
                  {importPreview.cards.length > 10 && (
                    <p className="text-sm text-[var(--color-text-muted)] pl-9">
                      ... e mais {importPreview.cards.length - 10} cards
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={confirmImport}
                  disabled={isPending}
                  className="btn-primary flex-1 cursor-pointer"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Confirmar Importação</>
                  )}
                </button>
                <button
                  onClick={() => setImportPreview(null)}
                  className="btn-ghost cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
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
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                <Package className="w-6 h-6" strokeWidth={1.5} />
              </div>
              {editingPack === activePack.id ? (
                <div className="flex-1 grid gap-2">
                  <input
                    value={packEditForm.name}
                    onChange={(e) => setPackEditForm({ ...packEditForm, name: e.target.value })}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      value={packEditForm.description}
                      onChange={(e) => setPackEditForm({ ...packEditForm, description: e.target.value })}
                      placeholder="Descrição"
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <select
                      value={packEditForm.level}
                      onChange={(e) => setPackEditForm({ ...packEditForm, level: e.target.value })}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Médio</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
                    {activePack.name}
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {activePack.cards?.length || 0} cards · {activePack.level || 'Sem nível'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {editingPack === activePack.id ? (
                <>
                  <button
                    onClick={() => handleUpdatePack(activePack.id)}
                    disabled={isPending || !packEditForm.name}
                    className="btn-primary text-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                  <button
                    onClick={() => setEditingPack(null)}
                    className="btn-ghost text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingPack(activePack.id)
                      setPackEditForm({
                        name: activePack.name,
                        description: activePack.description || '',
                        level: activePack.level || 'medium'
                      })
                    }}
                    className="btn-ghost text-sm cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleDeletePack(activePack.id)}
                    className="btn-ghost text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </button>
                </>
              )}
            </div>
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
                ?.sort((a: Card, b: Card) => (a.order_index || 0) - (b.order_index || 0))
                .map((card: Card, idx: number) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)] group animate-slide-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-xs font-bold text-[var(--color-text-subtle)] tabular-nums w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                      
                      {editingCard === card.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            value={editForm.en}
                            onChange={(e) => setEditForm({ ...editForm, en: e.target.value })}
                            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                          />
                          <input
                            value={editForm.pt}
                            onChange={(e) => setEditForm({ ...editForm, pt: e.target.value })}
                            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                          />
                          <button
                            onClick={() => handleUpdateCard(card.id)}
                            disabled={isPending}
                            className="btn-primary text-xs px-3 py-2"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingCard(null)
                              setEditForm({ en: '', pt: '' })
                            }}
                            className="btn-ghost text-xs px-3 py-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 flex-1">
                          <span className="font-semibold text-[var(--color-text)]">
                            {card.english_phrase || card.en}
                          </span>
                          <span className="hidden sm:block text-[var(--color-border)]">→</span>
                          <span className="text-[var(--color-text-muted)] text-sm">{card.portuguese_translation || card.pt}</span>
                        </div>
                      )}
                    </div>
                    
                    {editingCard !== card.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCard(card.id)
                            setEditForm({
                              en: card.english_phrase || card.en || '',
                              pt: card.portuguese_translation || card.pt || ''
                            })
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-error)] hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    )}
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
