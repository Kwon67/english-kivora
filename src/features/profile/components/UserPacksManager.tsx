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
  Globe,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  Plus
} from 'lucide-react'
import {
  appendCardsToUserPackAction,
  createManualUserPackAction,
  deleteUserPackAction,
  previewUserDeckAction,
  saveUserDeckAction,
} from '@/app/profile-pack-actions'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { motion, AnimatePresence } from 'framer-motion'

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
    <section className="space-y-6" aria-labelledby="user-packs-title">
      {/* Creation panel */}
      <div className="premium-card p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle background mesh */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-primary)]/[0.01] rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--color-border)]/40 pb-5">
          <div>
            <p className="section-kicker">Biblioteca pessoal</p>
            <h2 id="user-packs-title" className="mt-2 text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
              Meus Packs
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-[var(--color-text-muted)]">
              Crie packs privados com seus próprios cards ou use nossa inteligência artificial para gerar frases sob medida.
            </p>
          </div>
          <div className="flex h-fit items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-high)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] select-none">
            <Lock className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            Privados por padrão
          </div>
        </div>

        {/* Message Banner */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3.5 text-xs sm:text-sm font-bold ${
                message.type === 'success'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
              ) : (
                <FileText className="h-4.5 w-4.5 shrink-0 text-red-500" />
              )}
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Selector Tab */}
        <div className="mt-6 flex max-w-xs gap-1.5 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-container-lowest)] p-1">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              mode === 'manual'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]'
            }`}
          >
            <ListPlus className="h-3.5 w-3.5" />
            Manual
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              mode === 'ai'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            IA Gerador
          </button>
        </div>

        {/* Form sections */}
        <div className="mt-6">
          {mode === 'manual' ? (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleManualSubmit} 
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="target-pack" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                    Adicionar no Pacote
                  </label>
                  <select
                    id="target-pack"
                    value={targetPackId}
                    onChange={(event) => setTargetPackId(event.target.value)}
                    className="field font-bold border-[var(--color-border)]/80 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
                  >
                    <option value="new">Criar Novo Pack Privado</option>
                    {packs.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name}
                      </option>
                    ))}
                  </select>
                </div>

                {targetPackId === 'new' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="manual-name" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                        Nome do Pack
                      </label>
                      <input
                        id="manual-name"
                        value={manualName}
                        onChange={(event) => setManualName(event.target.value)}
                        className="field font-bold border-[var(--color-border)]/80 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                        placeholder="Ex: Business Meeting Essentials"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="manual-description" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                        Descrição
                      </label>
                      <input
                        id="manual-description"
                        value={manualDescription}
                        onChange={(event) => setManualDescription(event.target.value)}
                        className="field border-[var(--color-border)]/80 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                        placeholder="Ex: Frases cruciais para trabalho"
                      />
                    </div>
                  </div>
                ) : selectedTargetPack ? (
                  <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-container-low)] px-4 py-3 border-l-4 border-l-[var(--color-primary)]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-subtle)]">Destino selecionado</p>
                    <p className="mt-1 font-extrabold text-sm text-[var(--color-text)]">{selectedTargetPack.name}</p>
                  </div>
                ) : null}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="manual-cards" className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                      Cards (Inglês | Tradução)
                    </label>
                    <span className="text-[10px] font-semibold text-[var(--color-text-subtle)]">Um por linha</span>
                  </div>
                  <textarea
                    id="manual-cards"
                    value={manualCardsText}
                    onChange={(event) => setManualCardsText(event.target.value)}
                    className="field min-h-[160px] resize-y font-mono text-xs sm:text-sm border-[var(--color-border)]/80 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    placeholder={'I would like to clarify... | Eu gostaria de esclarecer...\nCould you elaborate? | Você poderia detalhar isso?'}
                    required
                  />
                </div>
              </div>

              <aside className="space-y-4 rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-container-low)] p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="manual-voice" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                      Voz de Pronúncia
                    </label>
                    <select
                      id="manual-voice"
                      value={manualVoice}
                      onChange={(event) => setManualVoice(event.target.value)}
                      className="field text-xs font-bold border-[var(--color-border)]/80 cursor-pointer"
                    >
                      {VOICES.map((voice) => (
                        <option key={voice.id} value={voice.id}>{voice.name} · {voice.meta}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-container-lowest)] p-3 text-center">
                      <Hash className="h-4 w-4 mx-auto text-[var(--color-primary)]" />
                      <p className="mt-1 text-xl font-extrabold text-[var(--color-text)]">{manualPreview.cards.length}</p>
                      <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">Válidos</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-container-lowest)] p-3 text-center">
                      <FileText className="h-4 w-4 mx-auto text-amber-500" />
                      <p className="mt-1 text-xl font-extrabold text-[var(--color-text)]">{manualPreview.invalidCount}</p>
                      <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">Inválidos</p>
                    </div>
                  </div>
                </div>

                <motion.button 
                  type="submit" 
                  disabled={manualSaving} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-primary w-full justify-center py-3 text-xs font-extrabold tracking-wider uppercase cursor-pointer"
                >
                  {manualSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {manualSaving ? 'Salvando...' : targetPackId === 'new' ? 'Criar Pack' : 'Adicionar Cards'}
                </motion.button>
              </aside>
            </motion.form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
            >
              <form onSubmit={handleAiPreview} className="space-y-4">
                <div>
                  <label htmlFor="ai-topic" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                    Tema ou Assunto
                  </label>
                  <input
                    id="ai-topic"
                    value={aiTopic}
                    onChange={(event) => setAiTopic(event.target.value)}
                    className="field text-sm font-bold border-[var(--color-border)]/80 focus:border-[var(--color-primary)]"
                    placeholder="Ex: Diálogo em uma cafeteria em NY"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
                  <div>
                    <label htmlFor="ai-count" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                      Cards
                    </label>
                    <input
                      id="ai-count"
                      type="number"
                      min={1}
                      max={30}
                      value={aiCount}
                      onChange={(event) => setAiCount(Number.parseInt(event.target.value, 10) || 10)}
                      className="field font-bold border-[var(--color-border)]/80"
                    />
                  </div>
                  <div>
                    <label htmlFor="ai-voice" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                      Voz de Pronúncia
                    </label>
                    <select
                      id="ai-voice"
                      value={aiVoice}
                      onChange={(event) => setAiVoice(event.target.value)}
                      className="field text-xs font-bold border-[var(--color-border)]/80 cursor-pointer"
                    >
                      {VOICES.map((voice) => (
                        <option key={voice.id} value={voice.id}>{voice.name} · {voice.meta}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ai-prompt" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                    Foco / Instruções Personalizadas
                  </label>
                  <textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    rows={3}
                    className="field resize-none border-[var(--color-border)]/80 focus:border-[var(--color-primary)]"
                    placeholder="Opcional: Foco em phrasal verbs, linguagem formal, conversação casual..."
                  />
                </div>

                <motion.button 
                  type="submit" 
                  disabled={aiLoading} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-primary py-3 px-5 text-xs font-extrabold tracking-wider uppercase cursor-pointer"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {aiLoading ? 'Gerando...' : 'Gerar com IA'}
                </motion.button>
              </form>

              <aside className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-container-low)] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-3 mb-4">
                    <div>
                      <p className="section-kicker">Revisão de Cards</p>
                      <p className="mt-1 text-xl font-extrabold text-[var(--color-text)]">{previewCards.length} gerados</p>
                    </div>
                    <Sparkles className="h-4.5 w-4.5 text-[var(--color-primary)]" />
                  </div>

                  <div className="max-h-[170px] space-y-2 overflow-y-auto pr-1">
                    {previewCards.length > 0 ? previewCards.map((card, index) => (
                      <div key={`${card.en}-${index}`} className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface-container-lowest)] p-3">
                        <p className="text-xs font-extrabold text-[var(--color-text)]">{card.en}</p>
                        <p className="mt-1 text-[10px] font-semibold text-[var(--color-text-muted)]">{card.pt}</p>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-dashed border-[var(--color-border)]/70 p-4 text-center text-xs font-bold text-[var(--color-text-subtle)]">
                        Os cards aparecerão aqui para revisão antes de serem salvos definitivamente.
                      </div>
                    )}
                  </div>
                </div>

                <motion.button
                  type="button"
                  disabled={previewCards.length === 0 || aiSaving}
                  onClick={handleAiSave}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-primary mt-4 w-full justify-center py-3 text-xs font-extrabold tracking-wider uppercase disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {aiSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {aiSaving ? 'Salvando...' : 'Salvar no Meu Perfil'}
                </motion.button>
              </aside>
            </motion.div>
          )}
        </div>
      </div>

      {/* User packs list */}
      <div>
        <p className="section-kicker mb-3">Meus Pacotes Criados</p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {packs.length > 0 ? packs.map((pack) => (
            <motion.article 
              key={pack.id} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
              className="premium-card p-5 relative overflow-hidden group flex flex-col justify-between"
            >
              {/* Subtle card background mesh */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--color-primary-light)]/5 pointer-events-none" />

              <div>
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        pack.isPublic 
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}>
                        {pack.isPublic ? (
                          <>
                            <Globe className="h-3 w-3" />
                            Público
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            Privado
                          </>
                        )}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--color-text-subtle)]">{formatDate(pack.createdAt)}</span>
                    </div>
                    <h3 className="mt-3 truncate text-base font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                      {pack.name}
                    </h3>
                    {pack.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                        {pack.description}
                      </p>
                    )}
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-[var(--color-primary)] shadow-sm">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
                  <div className="rounded-xl border border-[var(--color-border)]/65 bg-[var(--color-surface-container-lowest)] p-3 text-center">
                    <p className="text-xl font-extrabold text-[var(--color-text)]">{pack.cardCount}</p>
                    <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">Cards</p>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border)]/65 bg-[var(--color-surface-container-lowest)] p-3 text-center">
                    <p className="truncate text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider">
                      {pack.assignmentStatus === 'completed' ? 'Completo' : 'Estudando'}
                    </p>
                    <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">Rotina</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)]/45 pt-4 relative z-10">
                {pack.assignmentId ? (
                  <Link href={`/play/${pack.assignmentId}`} transitionTypes={navForwardTransitionTypes} className="btn-primary px-4 py-2 text-xs font-bold h-9">
                    <BookOpen className="h-3.5 w-3.5" />
                    Estudar
                  </Link>
                ) : (
                  <Link href="/home" transitionTypes={navForwardTransitionTypes} className="btn-primary px-4 py-2 text-xs font-bold h-9">
                    <BookOpen className="h-3.5 w-3.5" />
                    Iniciar Rotina
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMode('manual')
                    setTargetPackId(pack.id)
                  }}
                  className="btn-ghost px-3.5 py-2 text-xs font-bold h-9 bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-text)] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePack(pack)}
                  disabled={deletingPackId === pack.id}
                  className="btn-ghost px-3.5 py-2 text-xs font-bold h-9 text-[var(--color-error)] hover:bg-red-500/5 hover:text-red-600 cursor-pointer ml-auto"
                >
                  {deletingPackId === pack.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Excluir
                </button>
              </div>
            </motion.article>
          )) : (
            <div className="col-span-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-[var(--color-primary)] opacity-60" />
              <p className="mt-3 font-extrabold text-sm text-[var(--color-text)]">Nenhum pacote próprio criado</p>
              <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Use o gerador manual ou IA acima para começar a sua própria biblioteca.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
