'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  FileText,
  Hash,
  ListPlus,
  Loader2,
  Lock,
  Save,
  Sparkles,
  Wand2,
} from 'lucide-react'
import {
  appendCardsToUserPackAction,
  createManualUserPackAction,
  deleteUserPackAction,
  previewUserDeckAction,
  saveUserDeckAction,
} from '@/app/profile-pack-actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import {
  groupUserPacksByFolder,
  USER_MISC_PACK_FOLDER_LABEL,
  userFolderNameToStorage,
} from '@/features/cards/lib/packFolders'
import { glassPanel, glassTile, primaryBtn, profileField, sectionScrollMt, selectedPill, softKicker } from '@/features/profile/lib/profileUi'
import { notify } from '@/lib/toast'
import { m, AnimatePresence } from 'framer-motion'
import UserPackFoldersOrganizer from './UserPackFoldersOrganizer'

export type UserPackSummary = {
  id: string
  name: string
  description: string | null
  createdAt: string
  isPublic: boolean
  category: string | null
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

export default function UserPacksManager({ packs }: { packs: UserPackSummary[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [libraryExpanded, setLibraryExpanded] = useState(packs.length > 0)
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
  const [packToDelete, setPackToDelete] = useState<UserPackSummary | null>(null)
  const [extraFolders, setExtraFolders] = useState<string[]>([])
  const [manualFolder, setManualFolder] = useState('')
  const [aiFolder, setAiFolder] = useState('')

  const manualPreview = useMemo(() => parseManualCards(manualCardsText), [manualCardsText])
  const selectedTargetPack = packs.find((pack) => pack.id === targetPackId) || null
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#user-packs-title') return

    const element = document.getElementById('packs') || document.getElementById('user-packs-title')
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setLibraryExpanded(true)
  }, [])

  const folderOptions = useMemo(() => {
    const labels = new Set(groupUserPacksByFolder(packs).map((folder) => folder.label))
    for (const folder of extraFolders) labels.add(folder)
    return [...labels]
      .filter((label) => label !== USER_MISC_PACK_FOLDER_LABEL)
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
  }, [packs, extraFolders])

  useEffect(() => {
    const existing = new Set(
      packs
        .map((pack) => pack.category?.trim())
        .filter((value): value is string => Boolean(value))
    )

    setExtraFolders((current) => current.filter((folder) => !existing.has(folder)))
  }, [packs])

  function resolveFolderName(selection: string) {
    if (!selection || selection === USER_MISC_PACK_FOLDER_LABEL) return null
    return userFolderNameToStorage(selection)
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (manualPreview.cards.length === 0) {
      notify.error('Verifique os campos')
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
            folderName: resolveFolderName(manualFolder),
          })
        : await appendCardsToUserPackAction({
            packId: targetPackId,
            cards: manualPreview.cards,
            voice: manualVoice,
          })

      if (result.success) {
        notify.success('Pack adicionado com sucesso')
        setMessage({
          type: 'success',
          text: targetPackId === 'new'
            ? `Pack privado criado com ${result.cardCount} cards.`
            : `${result.cardCount} cards adicionados ao pack.`,
        })
        setManualName('')
        setManualDescription('')
        setManualCardsText('')
        setManualFolder('')
        setTargetPackId('new')
        router.refresh()
      } else {
        notify.error('Verifique os campos')
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      notify.error('Verifique os campos')
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
        notify.error('Verifique os campos')
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      notify.error('Verifique os campos')
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
      const result = await saveUserDeckAction(aiTopic, previewCards, aiVoice, resolveFolderName(aiFolder))
      if (result.success) {
        notify.success('Pack adicionado com sucesso')
        setMessage({ type: 'success', text: `Pack gerado salvo com ${result.cardCount} cards.` })
        setAiTopic('')
        setAiPrompt('')
        setPreviewCards([])
        setAiFolder('')
        router.refresh()
      } else {
        notify.error('Verifique os campos')
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      notify.error('Verifique os campos')
      setMessage({ type: 'error', text: 'Erro ao salvar o pack gerado.' })
    } finally {
      setAiSaving(false)
    }
  }

  async function handleDeletePack(pack: UserPackSummary) {
    setPackToDelete(null)
    setMessage(null)
    setDeletingPackId(pack.id)

    try {
      const result = await deleteUserPackAction(pack.id)
      if (result.success) {
        setMessage({ type: 'success', text: 'Pack excluído.' })
        router.refresh()
      } else {
        notify.error('Verifique os campos')
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      notify.error('Verifique os campos')
      setMessage({ type: 'error', text: 'Erro ao excluir o pack.' })
    } finally {
      setDeletingPackId(null)
    }
  }

  return (
    <section id="packs" className={`space-y-6 ${sectionScrollMt}`} aria-labelledby="user-packs-title">
      <article className={`${glassPanel} relative overflow-hidden p-5 sm:p-7`}>
        <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

        <div className="relative z-10 flex flex-col gap-4 border-b border-dashed border-[#172113]/20 pb-5 dark:border-[#d5e6a9]/20 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={softKicker}>Biblioteca pessoal</p>
            <h2 id="user-packs-title" className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">
              Criar conteúdo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
              Monte packs privados manualmente ou gere cards com IA. Tudo fica organizado na sua biblioteca.
            </p>
          </div>
          <div className="flex h-fit items-center gap-1.5 rounded-full border border-[#172113]/20 bg-[#eef3d6] px-3 py-1.5 text-xs font-semibold text-[#5a664e] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:text-[#9ea98b]">
            <Lock className="h-3.5 w-3.5 text-[#183b16] dark:text-[#b8ff5c]" />
            Privados por padrão
          </div>
        </div>

        {/* Message Banner */}
        <AnimatePresence mode="wait">
          {message && (
            <m.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3.5 text-xs sm:text-sm font-bold ${
	                message.type === 'success'
	                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-[#b8ff5c]/20 dark:bg-[#b8ff5c]/10 dark:text-[#b8ff5c]'
	                  : 'border-red-500/20 bg-red-500/10 text-red-600'
	              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500 dark:text-[#b8ff5c]" />
              ) : (
                <FileText className="h-4.5 w-4.5 shrink-0 text-red-500" />
              )}
              <span>{message.text}</span>
            </m.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 mt-6 flex w-full gap-1.5 rounded-xl border border-[#172113]/20 bg-[#f7f8ef] p-1 dark:border-[#d5e6a9]/20 dark:bg-[#080b06] sm:max-w-sm">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              mode === 'manual'
                ? selectedPill
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
                ? selectedPill
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            IA Gerador
          </button>
        </div>

        <div className="relative z-10 mt-6">
          {mode === 'manual' ? (
            <m.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleManualSubmit} 
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start"
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
                    className={`${profileField} font-bold cursor-pointer`}
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
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="manual-name" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                          Nome do Pack
                        </label>
                        <input
                          id="manual-name"
                          value={manualName}
                          onChange={(event) => setManualName(event.target.value)}
                          className={`${profileField} font-bold`}
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
                          className={profileField}
                          placeholder="Ex: Frases cruciais para trabalho"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="manual-folder" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                        Pasta privada
                      </label>
                      <select
                        id="manual-folder"
                        value={manualFolder}
                        onChange={(event) => setManualFolder(event.target.value)}
                        className={`${profileField} font-bold cursor-pointer`}
                      >
                        <option value="">{USER_MISC_PACK_FOLDER_LABEL}</option>
                        {folderOptions.map((folder) => (
                          <option key={folder} value={folder}>
                            {folder}
                          </option>
                        ))}
                      </select>
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
                    className={`${profileField} min-h-[160px] resize-y font-mono text-xs sm:text-sm`}
                    placeholder={'I would like to clarify... | Eu gostaria de esclarecer...\nCould you elaborate? | Você poderia detalhar isso?'}
                    required
                  />
                </div>
              </div>

              <aside className={`${glassTile} order-last space-y-4 p-5 lg:order-none flex flex-col justify-between`}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="manual-voice" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                      Voz de Pronúncia
                    </label>
                    <select
                      id="manual-voice"
                      value={manualVoice}
                      onChange={(event) => setManualVoice(event.target.value)}
                      className={`${profileField} text-xs font-bold cursor-pointer`}
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

                <m.button 
                  type="submit" 
                  disabled={manualSaving} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`${primaryBtn} w-full justify-center py-3 text-xs font-extrabold tracking-wider uppercase`}
                >
                  {manualSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {manualSaving ? 'Salvando...' : targetPackId === 'new' ? 'Criar Pack' : 'Adicionar Cards'}
                </m.button>
              </aside>
            </m.form>
          ) : (
            <m.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
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
                    className={`${profileField} text-sm font-bold`}
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
                      className={`${profileField} font-bold`}
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
                      className={`${profileField} text-xs font-bold cursor-pointer`}
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
                    className={`${profileField} resize-none`}
                    placeholder="Opcional: Foco em phrasal verbs, linguagem formal, conversação casual..."
                  />
                </div>

                <div>
                  <label htmlFor="ai-folder" className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)]">
                    Pasta privada
                  </label>
                  <select
                    id="ai-folder"
                    value={aiFolder}
                    onChange={(event) => setAiFolder(event.target.value)}
                    className={`${profileField} font-bold cursor-pointer`}
                  >
                    <option value="">{USER_MISC_PACK_FOLDER_LABEL}</option>
                    {folderOptions.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                </div>

                <m.button 
                  type="submit" 
                  disabled={aiLoading} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`${primaryBtn} py-3 px-5 text-xs font-extrabold tracking-wider uppercase`}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {aiLoading ? 'Gerando...' : 'Gerar com IA'}
                </m.button>
              </form>

              <aside className={`${glassTile} order-last p-5 lg:order-none flex flex-col justify-between`}>
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

                <m.button
                  type="button"
                  disabled={previewCards.length === 0 || aiSaving}
                  onClick={handleAiSave}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-primary mt-4 w-full justify-center py-3 text-xs font-extrabold tracking-wider uppercase disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {aiSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {aiSaving ? 'Salvando...' : 'Salvar no Meu Perfil'}
                </m.button>
              </aside>
            </m.div>
          )}
        </div>
      </article>

      <article className={`${glassPanel} overflow-hidden p-5 sm:p-7`}>
        <button
          type="button"
          onClick={() => setLibraryExpanded((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={libraryExpanded}
        >
          <div>
            <p className={softKicker}>Organização</p>
            <h3 className="mt-2 font-montserrat text-xl font-bold text-[#10130f] dark:text-[#f4f7e9]">
              Biblioteca por pastas
            </h3>
            <p className="mt-1 text-sm text-[#425039] dark:text-[#b9c3a4]">
              {packs.length} {packs.length === 1 ? 'pack' : 'packs'} na sua conta
            </p>
          </div>
          <span className="rounded-full border border-[#172113]/20 bg-[#eef3d6] px-3 py-1 text-xs font-bold text-[#183b16] dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c]">
            {libraryExpanded ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {libraryExpanded && (
          <div className="mt-5 border-t border-dashed border-[#172113]/20 pt-5 dark:border-[#d5e6a9]/20">
            <UserPackFoldersOrganizer
              packs={packs}
              extraFolders={extraFolders}
              onExtraFoldersChange={setExtraFolders}
              onAddToPack={(packId) => {
                setMode('manual')
                setTargetPackId(packId)
                document.getElementById('user-packs-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onRequestDelete={setPackToDelete}
              deletingPackId={deletingPackId}
            />
          </div>
        )}
      </article>
	      {packToDelete && (
	        <ConfirmDialog
	          title="Excluir pack"
	          description={`Excluir "${packToDelete.name}" e todos os cards dele?`}
	          confirmLabel="Excluir"
	          onCancel={() => setPackToDelete(null)}
	          onConfirm={() => {
	            void handleDeletePack(packToDelete)
	          }}
	        />
	      )}
	    </section>
	  )
	}
