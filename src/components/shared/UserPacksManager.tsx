'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Hash,
  ListPlus,
  Loader2,
  Lock,
  PlusCircle,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import {
  appendCardsToUserPackAction,
  createManualUserPackAction,
  deleteUserPackAction,
  previewUserDeckAction,
  saveUserDeckAction,
} from '@/app/profile-pack-actions'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export type UserPackSummary = {
  id: string
  name: string
  description: string | null
  createdAt: string
  isPublic: boolean
  cardCount: number
  assignmentId: string | null
  assignmentStatus: string | null
}

type GeneratedCard = {
  en: string
  pt: string
}

type Message = {
  type: 'success' | 'error'
  text: string
}

const VOICES = [
  { id: 'en-US-AriaNeural', name: 'Aria', meta: 'EUA · feminina' },
  { id: 'en-US-GuyNeural', name: 'Guy', meta: 'EUA · masculina' },
  { id: 'en-US-JennyNeural', name: 'Jenny', meta: 'EUA · feminina' },
]

function parseManualCards(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const cards: GeneratedCard[] = []
  let invalidCount = 0

  for (const line of lines) {
    const separator = ['|', '\t', '='].find((item) => line.includes(item))
    if (!separator) {
      invalidCount += 1
      continue
    }

    const separatorIndex = line.indexOf(separator)
    const en = line.slice(0, separatorIndex).replace(/\s+/g, ' ').trim()
    const pt = line.slice(separatorIndex + separator.length).replace(/\s+/g, ' ').trim()

    if (!en || !pt) {
      invalidCount += 1
      continue
    }

    cards.push({ en, pt })
  }

  return { cards, invalidCount, lineCount: lines.length }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function UserPacksManager({ packs }: { packs: UserPackSummary[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [message, setMessage] = useState<Message | null>(null)

  const [targetPackId, setTargetPackId] = useState('new')
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualCardsText, setManualCardsText] = useState('')
  const [manualVoice, setManualVoice] = useState(VOICES[0].id)
  const [manualSaving, setManualSaving] = useState(false)

  const [aiTopic, setAiTopic] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiCount, setAiCount] = useState(10)
  const [aiVoice, setAiVoice] = useState(VOICES[0].id)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSaving, setAiSaving] = useState(false)
  const [previewCards, setPreviewCards] = useState<GeneratedCard[]>([])
  const [deletingPackId, setDeletingPackId] = useState<string | null>(null)

  const manualPreview = useMemo(() => parseManualCards(manualCardsText), [manualCardsText])
  const selectedTargetPack = packs.find((pack) => pack.id === targetPackId) || null

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (manualPreview.cards.length === 0) {
      setMessage({ type: 'error', text: 'Adicione pelo menos um card no formato Inglês | Português.' })
      return
    }

    setManualSaving(true)
    try {
      const result = targetPackId === 'new'
        ? await createManualUserPackAction({
            name: manualName,
            description: manualDescription,
            cards: manualPreview.cards,
            voice: manualVoice,
          })
        : await appendCardsToUserPackAction({
            packId: targetPackId,
            cards: manualPreview.cards,
            voice: manualVoice,
          })

      if (result.success) {
        setMessage({
          type: 'success',
          text: targetPackId === 'new'
            ? `Pack privado criado com ${result.cardCount} cards.`
            : `${result.cardCount} cards adicionados ao pack.`,
        })
        setManualName('')
        setManualDescription('')
        setManualCardsText('')
        setTargetPackId('new')
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar os cards. Tente novamente.' })
    } finally {
      setManualSaving(false)
    }
  }

  async function handleAiPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setAiLoading(true)
    setPreviewCards([])

    try {
      const result = await previewUserDeckAction(aiTopic, aiCount, aiPrompt)
      if (result.success) {
        setPreviewCards(result.cards)
        setMessage({ type: 'success', text: `${result.cards.length} cards gerados para revisão.` })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Falha ao gerar prévia por IA.' })
    } finally {
      setAiLoading(false)
    }
  }

  async function handleAiSave() {
    if (previewCards.length === 0) return

    setMessage(null)
    setAiSaving(true)

    try {
      const result = await saveUserDeckAction(aiTopic, previewCards, aiVoice)
      if (result.success) {
        setMessage({ type: 'success', text: `Pack gerado salvo com ${result.cardCount} cards.` })
        setAiTopic('')
        setAiPrompt('')
        setPreviewCards([])
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar o pack gerado.' })
    } finally {
      setAiSaving(false)
    }
  }

  async function handleDeletePack(pack: UserPackSummary) {
    if (!window.confirm(`Excluir "${pack.name}" e todos os cards dele?`)) return

    setMessage(null)
    setDeletingPackId(pack.id)

    try {
      const result = await deleteUserPackAction(pack.id)
      if (result.success) {
        setMessage({ type: 'success', text: 'Pack excluído.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao excluir o pack.' })
    } finally {
      setDeletingPackId(null)
    }
  }

  return (
    <section className="space-y-5" aria-labelledby="user-packs-title">
      <div className="premium-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-kicker">Biblioteca pessoal</p>
            <h2 id="user-packs-title" className="mt-3 text-2xl font-black text-[var(--color-text)]">
              Meus packs
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              Crie packs privados com seus próprios cards ou gere uma prévia por IA antes de salvar.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-[0.85rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-3 py-2 text-xs font-bold text-[var(--color-text-muted)]">
            <Lock className="h-4 w-4 text-[var(--color-primary)]" />
            Privado por padrão
          </div>
        </div>

        {message && (
          <div className={`mt-5 flex items-start gap-3 rounded-[0.9rem] border px-4 py-3 text-sm font-semibold ${
            message.type === 'success'
              ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300'
              : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mt-6 grid gap-2 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-1 sm:inline-grid sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`inline-flex items-center justify-center gap-2 rounded-[0.75rem] px-4 py-2.5 text-sm font-black transition-colors ${
              mode === 'manual'
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]'
            }`}
          >
            <ListPlus className="h-4 w-4" />
            Manual
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`inline-flex items-center justify-center gap-2 rounded-[0.75rem] px-4 py-2.5 text-sm font-black transition-colors ${
              mode === 'ai'
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            IA
          </button>
        </div>

        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <div>
                <label htmlFor="target-pack" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                  Destino
                </label>
                <select
                  id="target-pack"
                  value={targetPackId}
                  onChange={(event) => setTargetPackId(event.target.value)}
                  className="field font-bold"
                >
                  <option value="new">Criar novo pack privado</option>
                  {packs.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      Adicionar em {pack.name}
                    </option>
                  ))}
                </select>
              </div>

              {targetPackId === 'new' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="manual-name" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                      Nome do pack
                    </label>
                    <input
                      id="manual-name"
                      value={manualName}
                      onChange={(event) => setManualName(event.target.value)}
                      className="field font-bold"
                      placeholder="Ex: reuniões em inglês"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="manual-description" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                      Descrição
                    </label>
                    <input
                      id="manual-description"
                      value={manualDescription}
                      onChange={(event) => setManualDescription(event.target.value)}
                      className="field"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              ) : selectedTargetPack ? (
                <div className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">Adicionando em</p>
                  <p className="mt-1 font-black text-[var(--color-text)]">{selectedTargetPack.name}</p>
                </div>
              ) : null}

              <div>
                <label htmlFor="manual-cards" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                  Cards
                </label>
                <textarea
                  id="manual-cards"
                  value={manualCardsText}
                  onChange={(event) => setManualCardsText(event.target.value)}
                  className="field min-h-44 resize-y font-mono text-sm"
                  placeholder={'I need help | Preciso de ajuda\nCan you repeat that? | Pode repetir isso?'}
                  required
                />
              </div>
            </div>

            <aside className="space-y-4 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4">
              <div>
                <label htmlFor="manual-voice" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                  Voz
                </label>
                <select
                  id="manual-voice"
                  value={manualVoice}
                  onChange={(event) => setManualVoice(event.target.value)}
                  className="field text-sm font-bold"
                >
                  {VOICES.map((voice) => (
                    <option key={voice.id} value={voice.id}>{voice.name} · {voice.meta}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[0.8rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
                  <Hash className="h-4 w-4 text-[var(--color-primary)]" />
                  <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{manualPreview.cards.length}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">válidos</p>
                </div>
                <div className="rounded-[0.8rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
                  <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                  <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{manualPreview.invalidCount}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">ignorados</p>
                </div>
              </div>

              <button type="submit" disabled={manualSaving} className="btn-primary w-full justify-center">
                {manualSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {manualSaving ? 'Salvando' : targetPackId === 'new' ? 'Criar pack' : 'Adicionar cards'}
              </button>
            </aside>
          </form>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <form onSubmit={handleAiPreview} className="space-y-4">
              <div>
                <label htmlFor="ai-topic" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                  Tema
                </label>
                <input
                  id="ai-topic"
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                  className="field text-base font-bold"
                  placeholder="Ex: frases para daily meeting"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <div>
                  <label htmlFor="ai-count" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                    Quantidade
                  </label>
                  <input
                    id="ai-count"
                    type="number"
                    min={1}
                    max={30}
                    value={aiCount}
                    onChange={(event) => setAiCount(Number.parseInt(event.target.value, 10) || 10)}
                    className="field font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="ai-voice" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                    Voz
                  </label>
                  <select
                    id="ai-voice"
                    value={aiVoice}
                    onChange={(event) => setAiVoice(event.target.value)}
                    className="field font-bold"
                  >
                    {VOICES.map((voice) => (
                      <option key={voice.id} value={voice.id}>{voice.name} · {voice.meta}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="ai-prompt" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                  Instruções
                </label>
                <textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  className="field min-h-28 resize-y"
                  placeholder="Opcional: use linguagem formal, foque em phrasal verbs..."
                />
              </div>

              <button type="submit" disabled={aiLoading} className="btn-primary">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {aiLoading ? 'Gerando' : 'Gerar prévia'}
              </button>
            </form>

            <aside className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Prévia</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{previewCards.length}</p>
                </div>
                <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
              </div>

              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {previewCards.length > 0 ? previewCards.map((card, index) => (
                  <div key={`${card.en}-${index}`} className="rounded-[0.8rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
                    <p className="text-sm font-black text-[var(--color-text)]">{card.en}</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">{card.pt}</p>
                  </div>
                )) : (
                  <div className="rounded-[0.8rem] border border-dashed border-[var(--color-border)] p-4 text-sm font-semibold text-[var(--color-text-muted)]">
                    A prévia dos cards aparece aqui antes de salvar.
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={previewCards.length === 0 || aiSaving}
                onClick={handleAiSave}
                className="btn-primary mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {aiSaving ? 'Salvando' : 'Salvar pack'}
              </button>
            </aside>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {packs.length > 0 ? packs.map((pack) => (
          <article key={pack.id} className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-[11px] font-black text-[var(--color-primary)]">
                    <Lock className="h-3 w-3" />
                    {pack.isPublic ? 'Público' : 'Privado'}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-subtle)]">{formatDate(pack.createdAt)}</span>
                </div>
                <h3 className="mt-3 truncate text-lg font-black text-[var(--color-text)]">{pack.name}</h3>
                {pack.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">{pack.description}</p>
                )}
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.85rem] bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[0.8rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
                <p className="text-2xl font-black text-[var(--color-text)]">{pack.cardCount}</p>
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">cards</p>
              </div>
              <div className="rounded-[0.8rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
                <p className="truncate text-sm font-black text-[var(--color-text)]">{pack.assignmentStatus || 'pending'}</p>
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">rotina</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {pack.assignmentId ? (
                <Link href={`/play/${pack.assignmentId}`} transitionTypes={navForwardTransitionTypes} className="btn-primary px-4 py-2 text-sm">
                  <BookOpen className="h-4 w-4" />
                  Estudar
                </Link>
              ) : (
                <Link href="/home" transitionTypes={navForwardTransitionTypes} className="btn-primary px-4 py-2 text-sm">
                  <BookOpen className="h-4 w-4" />
                  Rotina
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMode('manual')
                  setTargetPackId(pack.id)
                }}
                className="btn-ghost px-4 py-2 text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePack(pack)}
                disabled={deletingPackId === pack.id}
                className="btn-ghost px-4 py-2 text-sm text-[var(--color-error)]"
              >
                {deletingPackId === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir
              </button>
            </div>
          </article>
        )) : (
          <div className="lg:col-span-2 rounded-[1rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--color-primary)]" />
            <p className="mt-3 font-black text-[var(--color-text)]">Nenhum pack próprio ainda</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Crie o primeiro pack manualmente ou gere uma prévia por IA.</p>
          </div>
        )}
      </div>
    </section>
  )
}
