'use client'

import { useState, useEffect, useTransition, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  createPack, 
  deletePack, 
  createCard, 
  deleteCard, 
  importPackWithCards, 
  updateCard,
  updatePack,
  addCardsToExistingPack
} from '@/app/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ModalPortal from '@/components/ui/ModalPortal'
import { parseBulkImport, parseJsonImport, parseApkg } from '@/features/cards/lib/apkgParser'
import { formatAcceptedTranslations } from '@/features/cards/lib/cardTranslations'
import PackCardsOrganizer from './PackCardsOrganizer'
import PackLibraryOrganizer from './PackLibraryOrganizer'
import { analyzeImportCards, type ImportAnalysis } from '@/features/cards/lib/importCards'
import { notify } from '@/lib/toast'
import type { Pack, Card } from '@/types/database.types'
import { 
  Package, 
  Plus, 
  Trash2, 
  Loader2, 
  BookOpen, 
  Upload, 
  FileText,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Mic,
  Play
} from 'lucide-react'

type PendingDeleteAction =
  | { type: 'pack'; id: string; name: string }
  | { type: 'card'; id: string; name: string }

export default function PacksPage() {
  const [packs, setPacks] = useState<(Pack & { cards: Card[] })[]>([])
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [showNewPack, setShowNewPack] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [importPreview, setImportPreview] = useState<{
    name: string
    description?: string
    level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    cards: { en: string; pt: string }[]
    source: string
    analysis: ImportAnalysis
  } | null>(null)
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new')
  const [selectedPackForImport, setSelectedPackForImport] = useState<string>('')
  const [importPackVisibility, setImportPackVisibility] = useState<'private' | 'public'>('public')
  const [importError, setImportError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [autoGenerateTts, setAutoGenerateTts] = useState(true)
  const [ttsState, setTtsState] = useState<{ active: boolean; currentCount: number; totalCount: number; failedCount: number; currentPhrase?: string } | null>(null)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ en: '', pt: '', acceptedTranslations: '' })
  const [editingPack, setEditingPack] = useState<string | null>(null)
  const [packEditForm, setPackEditForm] = useState({ name: '', description: '', level: '' })
  const [actionError, setActionError] = useState<string | null>(null)
  const [showRegenerateTts, setShowRegenerateTts] = useState<string | null>(null)
  const [pendingDeleteAction, setPendingDeleteAction] = useState<PendingDeleteAction | null>(null)
  const [regenerateVoice, setRegenerateVoice] = useState('en-US-RogerNeural')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const selectedPackDetailRef = useRef<HTMLDivElement>(null)
  const regenerateModalRef = useRef<HTMLDivElement>(null)
  
  const VOICES = [
    { id: 'en-US-RogerNeural', name: 'Roger (mais natural e humana)' },
    { id: 'en-US-EmmaMultilingualNeural', name: 'Emma (Multilingual · muito natural)' },
    { id: 'en-US-AvaMultilingualNeural', name: 'Ava (Multilingual · brilhante)' },
    { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew (Multilingual · quente)' },
    { id: 'en-US-BrianMultilingualNeural', name: 'Brian (Multilingual)' },
    { id: 'en-US-AriaNeural', name: 'Aria (clara e confiável)' },
    { id: 'en-US-SteffanNeural', name: 'Steffan' }
  ]
  const [selectedVoice, setSelectedVoice] = useState('en-US-RogerNeural')
  const [previewingVoice, setPreviewingVoice] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function handlePreviewVoice(e?: React.MouseEvent, voiceToPreview?: string) {
    if (e) {
       e.preventDefault()
       e.stopPropagation()
    }
    if (previewingVoice) return
    setPreviewingVoice(true)
    if (audioRef.current) audioRef.current.pause()

    const voice = voiceToPreview || selectedVoice

    try {
      const previewText = 'Hello! Welcome to English Kivora. The weather today is absolutely wonderful.'
      const url = `/api/tts/preview?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(previewText)}`
      const res = await fetch(url)
      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 503 || errText.includes('503') || errText.includes('UNAVAILABLE')) {
          notify.error('Erro ao carregar dados')
        } else {
          notify.error('Erro ao carregar dados')
        }
        setPreviewingVoice(false)
        return
      }
      const blob = await res.blob()
      if (blob.size === 0) {
        setPreviewingVoice(false)
        return
      }
      const blobUrl = URL.createObjectURL(blob)
      const audio = new Audio(blobUrl)
      audioRef.current = audio
      audio.onended = () => { setPreviewingVoice(false); URL.revokeObjectURL(blobUrl) }
      audio.onerror = () => {
        setPreviewingVoice(false)
        URL.revokeObjectURL(blobUrl)
      }
      await audio.play()
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setPreviewingVoice(false)
        return
      }
      setPreviewingVoice(false)
    }
  }

  const activePack = packs.find((p) => p.id === selectedPack)
  const selectedImportPack = packs.find((pack) => pack.id === selectedPackForImport)
  const importAnalysis = useMemo(() => {
    if (!importPreview) return null

    return analyzeImportCards(
      importPreview.cards,
      importMode === 'existing' && selectedImportPack
        ? (selectedImportPack.cards || []).map((card) => ({
            en: card.english_phrase || card.en || '',
            pt: card.portuguese_translation || card.pt || '',
          }))
        : []
    )
  }, [importMode, importPreview, selectedImportPack])

  async function loadPacks() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('packs')
      .select('*, cards(*)')
      .order('created_at', { ascending: false })

    if (error) {
      notify.error('Erro ao carregar dados')
      return
    }
    if (data) setPacks(data as (Pack & { cards: Card[] })[])
  }

  useEffect(() => {
    setTimeout(() => loadPacks(), 0)
  }, [])

  useEffect(() => {
    if (!selectedPack || typeof window === 'undefined') return

    const frame = window.requestAnimationFrame(() => {
      selectedPackDetailRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedPack])

  useEffect(() => {
    if (ttsState?.active) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [ttsState?.active])

  useEffect(() => {
    if (!showRegenerateTts) return

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const firstFocusable = regenerateModalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setShowRegenerateTts(null)
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        regenerateModalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [showRegenerateTts])

  async function generateTtsForPack(packId: string) {
    const supabase = createClient()
    const { data: cards } = await supabase
      .from('cards')
      .select('id, english_phrase')
      .eq('pack_id', packId)
      .is('audio_url', null)

    if (!cards || cards.length === 0) return

    setTtsState({ active: true, currentCount: 0, totalCount: cards.length, failedCount: 0 })

    let current = 0
    let failed = 0
    for (const card of cards) {
      setTtsState(prev => prev ? { ...prev, currentPhrase: card.english_phrase } : null)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, text: card.english_phrase, voice: selectedVoice })
        })
        if (!res.ok) failed++
      } catch {
        failed++
      }
      current++
      setTtsState(prev => prev ? { ...prev, currentCount: current, failedCount: failed } : null)
    }

    setTtsState(null)
    loadPacks()
    return { generated: current - failed, failed }
  }

  async function generateAllMissingTts() {
    const missingCards = packs.flatMap(p => p.cards).filter(c => !c.audio_url)
    if (missingCards.length === 0) return

    setTtsState({ active: true, currentCount: 0, totalCount: missingCards.length, failedCount: 0 })

    let current = 0
    let failed = 0
    for (const card of missingCards) {
      if (!card.english_phrase) continue
      const phrase = card.english_phrase
      setTtsState(prev => prev ? { ...prev, currentPhrase: phrase } : null)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, text: phrase, voice: selectedVoice })
        })
        if (!res.ok) failed++
      } catch {
        failed++
      }
      current++
      setTtsState(prev => prev ? { ...prev, currentCount: current, failedCount: failed } : null)
    }

    setTtsState(null)
    loadPacks()
    notify.success(`Geração concluída! ${current - failed} áudios gerados.`)
  }

  async function regenerateAllTtsForPack(packId: string) {
    const supabase = createClient()
    const { data: cards } = await supabase
      .from('cards')
      .select('id, english_phrase')
      .eq('pack_id', packId)

    if (!cards || cards.length === 0) {
      notify.error('Erro ao carregar dados')
      setShowRegenerateTts(null)
      return
    }

    setTtsState({ active: true, currentCount: 0, totalCount: cards.length, failedCount: 0 })
    setShowRegenerateTts(null)

    let current = 0
    let failed = 0
    for (const card of cards) {
      if (!card.english_phrase) {
        failed++
        current++
        continue
      }
      setTtsState(prev => prev ? { ...prev, currentPhrase: card.english_phrase } : null)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, text: card.english_phrase, voice: regenerateVoice })
        })
        if (!res.ok) failed++
      } catch {
        failed++
      }
      current++
      setTtsState(prev => prev ? { ...prev, currentCount: current, failedCount: failed } : null)
    }

    setTtsState(null)
    loadPacks()
    notify.success(`Regeneração concluída! ${current - failed} áudios atualizados.`)
  }

  async function regenerateSingleCardTts(cardId: string, text: string) {
    if (!text) return
    
    setTtsState({ 
      active: true, 
      currentCount: 0, 
      totalCount: 1, 
      failedCount: 0,
      currentPhrase: text
    })

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, text, voice: selectedVoice })
      })
      
      if (!res.ok) {
        throw new Error('Erro na geração do áudio')
      }
      
      loadPacks()
    } catch {
      notify.error('Erro ao carregar dados')
    } finally {
      setTtsState(null)
    }
  }

  async function handleCreatePack(formData: FormData) {
    startTransition(async () => {
      setActionError(null)
      try {
	        const result = await createPack(formData)
	        if (result?.success) {
	          setShowNewPack(false)
	          loadPacks()
	          notify.success('Pack adicionado com sucesso')
	          return
	        }
	        notify.error('Verifique os campos')
	        setActionError(result?.error || 'Não foi possível criar o pack.')
	      } catch (error) {
	        notify.error('Verifique os campos')
	        setActionError('Erro ao criar pack: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
	      }
    })
  }

  async function handleDeletePack(id: string) {
    setPendingDeleteAction(null)
    startTransition(async () => {
      setActionError(null)
      try {
	        const result = await deletePack(id)
	        if (result?.error) {
	          notify.error('Verifique os campos')
	          setActionError(result.error)
	          return
	        }
        setSelectedPack(null)
        setEditingPack(null)
        setEditingCard(null)
	        loadPacks()
	      } catch (error) {
	        notify.error('Verifique os campos')
	        setActionError('Erro ao excluir pack: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
	      }
    })
  }

  async function handleCreateCard(formData: FormData) {
    startTransition(async () => {
      setActionError(null)
      try {
	        const result = await createCard(formData)
	        if (result?.success) {
	          loadPacks()
	          notify.success('Pack adicionado com sucesso')
	          return
	        }
	        notify.error('Verifique os campos')
	        setActionError(result?.error || 'Não foi possível adicionar o card.')
	      } catch (error) {
	        notify.error('Verifique os campos')
	        setActionError('Erro ao adicionar card: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
	      }
    })
  }

  async function handleDeleteCard(id: string) {
    setPendingDeleteAction(null)
    startTransition(async () => {
      setActionError(null)
      try {
	        const result = await deleteCard(id)
	        if (result?.error) {
	          notify.error('Verifique os campos')
	          setActionError(result.error)
	          return
	        }
        if (editingCard === id) {
          setEditingCard(null)
          setEditForm({ en: '', pt: '', acceptedTranslations: '' })
        }
	        loadPacks()
	      } catch (error) {
	        notify.error('Verifique os campos')
	        setActionError('Erro ao excluir card: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
	      }
    })
  }

  async function handleUpdateCard(cardId: string) {
    startTransition(async () => {
      setActionError(null)
      try {
        const result = await updateCard(cardId, editForm)
	        if (result?.success) {
	          setEditingCard(null)
	          setEditForm({ en: '', pt: '', acceptedTranslations: '' })
	          loadPacks()
	          return
	        }
	        notify.error('Verifique os campos')
	        setActionError(result?.error || 'Não foi possível atualizar o card.')
	      } catch (error) {
	        notify.error('Verifique os campos')
	        setActionError('Erro ao atualizar card: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
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
      setActionError(null)
      try {
        const result = await updatePack(packId, formData)
	        if (result?.success) {
	          setEditingPack(null)
	          loadPacks()
	          return
	        }
	        notify.error('Verifique os campos')
	        setActionError(result?.error || 'Não foi possível atualizar o pack.')
	      } catch (error) {
	        notify.error('Verifique os campos')
	        setActionError('Erro ao atualizar pack: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
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
        const cards = result.cards.map((c: { front: string; back: string }) => ({ en: c.front, pt: c.back }))
        setImportPreview({
          name: result.deckName,
          description: result.description,
          level: 'B1',
          cards,
          analysis: analyzeImportCards(cards),
          source: 'apkg'
        })
      } else if (ext.endsWith('.json')) {
        const text = await file.text()
        const result = parseJsonImport(text)
        if (result) {
          const cards = result.cards.map((c: { front: string; back: string; en?: string; pt?: string }) => ({ 
            en: c.en || c.front || '', 
            pt: c.pt || c.back || '' 
          }))
          setImportPreview({
            name: result.name,
            cards,
            analysis: analyzeImportCards(cards),
            level: 'B1',
            source: 'json'
          })
        } else {
          setImportError('Formato JSON inválido')
        }
      } else if (ext.endsWith('.csv') || ext.endsWith('.txt')) {
        const text = await file.text()
        const cards = parseBulkImport(text)
        const normalizedCards = cards.map((c: { en?: string; pt?: string; front?: string; back?: string }) => ({ 
          en: c.en || c.front || '', 
          pt: c.pt || c.back || '' 
        }))
        setImportPreview({
          name: file.name.replace(/\.[^/.]+$/, ''),
          cards: normalizedCards,
          analysis: analyzeImportCards(normalizedCards),
          level: 'B1',
          source: ext.endsWith('.csv') ? 'csv' : 'text'
        })
      } else {
        setImportError('Formato não suportado')
      }
    } catch (error) {
      setImportError('Erro ao processar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
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
      setImportError('Nenhum card encontrado')
      return
    }
    setImportPreview({
      name: 'Pack Importado',
      cards: cards.map(c => ({ en: c.front, pt: c.back })),
      analysis: analyzeImportCards(cards.map(c => ({ en: c.front, pt: c.back }))),
      level: 'B1',
      source: 'text'
    })
    setImportError(null)
  }, [])

  function handleToggleImportPanel() {
    const next = !showImport
    setShowImport(next)
    setActionError(null)

    if (next) {
      setShowNewPack(false)
      return
    }

    setImportPreview(null)
    setImportError(null)
    setImportLoading(false)
    setImportMode('new')
    setImportPackVisibility('public')
    setSelectedPackForImport('')

    if (textareaRef.current) textareaRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function clearImportPreview() {
    setImportPreview(null)
    setImportError(null)

    if (textareaRef.current) textareaRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleImportFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    await handleFileImport(file)
    event.target.value = ''
  }

  async function confirmImport() {
    if (!importPreview) return
    setImportError(null)

    if (importMode === 'existing' && !selectedPackForImport) {
      setImportError('Selecione um pack')
      return
    }
    if (!importAnalysis || importAnalysis.validCards.length === 0) {
      setImportError('Nenhum card válido')
      return
    }

    startTransition(async () => {
      setActionError(null)
      try {
        if (importMode === 'existing') {
          const result = await addCardsToExistingPack({
            packId: selectedPackForImport,
            cards: importAnalysis.validCards
          })
          if (result?.success) {
            clearImportPreview()
            setShowImport(false)
            setImportMode('new')
	            setSelectedPackForImport('')
	            if (autoGenerateTts) await generateTtsForPack(result.packId!)
	            loadPacks()
	            notify.success('Pack adicionado com sucesso')
	          } else if (result?.error) {
	            notify.error('Verifique os campos')
	            setActionError(result.error)
	          }
	        } else {
          const result = await importPackWithCards({
            name: importPreview.name,
            description: importPreview.description,
            level: importPreview.level,
            visibility: importPackVisibility,
            cards: importAnalysis.validCards
          })
          if (result?.success) {
            clearImportPreview()
	            setShowImport(false)
	            setImportPackVisibility('public')
	            if (autoGenerateTts) await generateTtsForPack(result.packId!)
	            loadPacks()
	            notify.success('Pack adicionado com sucesso')
	          } else if (result?.error) {
	            notify.error('Verifique os campos')
	            setActionError(result.error)
	          }
	        }
	      } catch (err) {
	        notify.error('Verifique os campos')
	        setActionError('Erro: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
	      }
    })
  }

  const totalCards = packs.reduce((sum, pack) => sum + (pack.cards?.length || 0), 0)
  const missingAudioCount = packs.reduce((sum, pack) => sum + (pack.cards || []).filter((card) => !card.audio_url).length, 0)

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Conteúdo do programa</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Packs e cards
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Crie, importe e mantenha frases com áudio para as atividades.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleToggleImportPanel}
            className="btn-ghost inline-flex items-center justify-center px-5 py-2.5 text-sm"
          >
            {showImport ? 'Fechar importação' : 'Importar'}
          </button>
          <button
            type="button"
            onClick={() => setShowNewPack(!showNewPack)}
            data-testid="open-new-pack"
            className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm"
          >
            {showNewPack ? 'Fechar novo pack' : 'Criar pack'}
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Packs',
            value: packs.length,
            icon: Package,
            accent: 'bg-[var(--color-surface-container-high)] text-text-muted border-border',
          },
          {
            label: 'Cards',
            value: totalCards,
            icon: BookOpen,
            accent: 'bg-[var(--color-secondary-container)] text-[var(--color-secondary)] border-[var(--color-secondary-container)]',
          },
          {
            label: 'Sem áudio',
            value: missingAudioCount,
            icon: Mic,
            accent: 'bg-primary-light text-primary border-[var(--color-primary-light)]',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-[0.9rem] border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-border-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-text">{stat.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${stat.accent}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-text">Voz Padrão (TTS)</h3>
            <p className="text-xs font-medium text-text-subtle mt-1">Usada para gerar os áudios das novas frases.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-[var(--color-surface-container-low)] px-3 py-2">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="min-w-[200px] cursor-pointer bg-transparent text-sm font-medium text-text focus:outline-none"
            >
              {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
	            <button
	              type="button"
	              onClick={handlePreviewVoice}
	              disabled={previewingVoice}
	              aria-label="Pré-visualizar voz"
	              className={`rounded-lg p-2 transition-colors ${ previewingVoice ? 'bg-[var(--color-surface-container-high)] text-text-subtle' : 'border border-border bg-surface-container-lowest text-primary hover:border-[var(--color-primary-container)]' }`}
            >
              {previewingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {missingAudioCount > 0 && (
          <div className="mt-5 rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] p-4">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <h3 className="text-sm font-semibold text-text">Áudios pendentes</h3>
                <p className="mt-1 max-w-xl text-sm text-text-muted">
                  Existem <strong className="text-text">{missingAudioCount} frases</strong> sem pronúncia. Gere usando a voz <strong className="text-text">{VOICES.find(v => v.id === selectedVoice)?.name}</strong>.
                </p>
              </div>
              <button
                 onClick={generateAllMissingTts}
                 disabled={ttsState?.active}
                 className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Gerar áudios
              </button>
            </div>
          </div>
        )}
      </section>

      {actionError && (
        <div className="rounded-[0.85rem] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-4 py-3 text-sm font-bold text-[var(--color-error)] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* TTS Generation Overlay - Solidified */}
      {ttsState?.active && (
        <ModalPortal
          closeOnBackdrop={false}
          className="fixed inset-0 z-[99999] flex min-h-[100dvh] items-center justify-center overflow-y-auto overscroll-contain bg-[#1C1915]/15 p-4 backdrop-blur-2xl dark:bg-black/50"
        >
          <div className="premium-card mx-4 my-auto flex w-full max-w-sm flex-col items-center overflow-hidden p-6 text-center shadow-[var(--shadow-xl)]">
            <Loader2 className="mb-4 h-6 w-6 animate-spin text-primary" strokeWidth={2} />
            <h3 className="mb-2 text-lg font-semibold text-text">Processando áudio</h3>
            <p className="mb-6 text-sm text-text-muted">
              Gerando narrações neurais. Mantenha esta aba aberta.
            </p>
            {ttsState.currentPhrase && (
              <div className="mb-6 w-full rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Frase atual</p>
                <p className="line-clamp-2 text-sm font-medium leading-relaxed text-text">
                  &quot;{ttsState.currentPhrase}&quot;
                </p>
              </div>
            )}
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-container-low)]">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${(ttsState.currentCount / ttsState.totalCount) * 100}%` }}
              />
            </div>
            <p className="text-sm font-medium text-text-muted">
              {ttsState.currentCount} / {ttsState.totalCount}
            </p>
          </div>
        </ModalPortal>
      )}

      {/* Regenerate TTS Modal */}
      {showRegenerateTts && (
        <ModalPortal
          onClose={() => setShowRegenerateTts(null)}
          className="fixed inset-0 z-[99998] flex min-h-[100dvh] items-center justify-center overflow-y-auto overscroll-contain bg-[#1C1915]/15 p-4 backdrop-blur-2xl dark:bg-black/50"
        >
          <div
            ref={regenerateModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="regenerate-tts-title"
            className="premium-card my-auto w-full max-w-md overflow-hidden p-6 shadow-[var(--shadow-xl)] animate-scale-in"
          >
            <p className="section-kicker">TTS</p>
            <h3 id="regenerate-tts-title" className="mt-2 text-lg font-bold text-text">Refazer vozes</h3>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-text-muted">
              Isso irá recriar os áudios de <strong className="text-text">todas as frases</strong> deste pacote, substituindo os antigos. Escolha a voz que deseja usar.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-text-subtle">Selecione a Voz</label>
                <div className="mt-2 flex items-center gap-2 bg-[var(--color-surface-container-low)] border border-border rounded-xl px-4 py-2">
                  <select
                    value={regenerateVoice}
                    onChange={(e) => setRegenerateVoice(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-text focus:outline-none cursor-pointer"
                  >
                    {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
	                  <button
	                    type="button"
	                    onClick={(e) => handlePreviewVoice(e, regenerateVoice)}
	                    disabled={previewingVoice}
	                    aria-label="Pré-visualizar voz"
	                    className={`p-2 rounded-lg transition-all ${ previewingVoice ? 'bg-[var(--color-surface-container-high)] text-text-subtle' : 'bg-surface-container-lowest text-primary border border-border hover:border-[var(--color-primary-container)]' }`}
                  >
                    {previewingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => regenerateAllTtsForPack(showRegenerateTts)}
                className="flex-1 btn-primary !rounded-xl !bg-primary !text-on-primary py-3"
              >
                <Mic className="w-4 h-4 mr-1.5" strokeWidth={2.5} /> Iniciar
              </button>
              <button 
                onClick={() => setShowRegenerateTts(null)}
                className="flex-1 btn-ghost !rounded-xl border border-border py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {showImport && (
        <section className="card space-y-5 p-4 sm:p-5 animate-slide-up">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker">Importação</p>
              <h3 className="mt-3 font-black text-2xl text-text">Importar pack</h3>
              <p className="mt-1 max-w-2xl text-sm font-medium text-text-muted">
                Selecione um arquivo `.apkg`, `.json`, `.csv` ou `.txt`, ou cole linhas no formato
                ` inglês | tradução `, ` inglês, tradução ` ou separadas por tabulação.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="btn-primary px-6 !rounded-xl"
              >
                {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" strokeWidth={2.5} />}
                Selecionar arquivo
              </button>
              <button
                type="button"
                onClick={handleTextImport}
                disabled={importLoading}
                className="btn-ghost px-6 !rounded-xl"
              >
                <FileText className="w-4 h-4" strokeWidth={2.5} />
                Ler texto colado
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".apkg,.json,.csv,.txt,application/json,text/csv,text/plain"
            className="hidden"
            onChange={handleImportFileSelection}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="rounded-[1rem] border border-border bg-[var(--color-surface-container-low)] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Fonte</p>
                  <h4 className="mt-2 text-lg font-black tracking-tight text-text">Arquivo ou texto bruto</h4>
                </div>
                <div className="rounded-xl border border-[var(--color-primary-light)] bg-surface-container-lowest px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                  APKG pronto
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border bg-surface-container-lowest px-5 py-6 text-sm font-bold text-text-muted transition-all hover:border-[var(--color-primary-container)] hover:text-primary"
              >
                {importLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" strokeWidth={2.5} />}
                {importLoading ? 'Processando arquivo...' : 'Escolher .apkg, .json, .csv ou .txt'}
              </button>

              <div className="mt-5 rounded-[1.5rem] border border-border bg-surface-container-lowest p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-subtle">Colar conteúdo</p>
                <textarea
                  ref={textareaRef}
                  rows={8}
                  placeholder={`hello there | olá\nI am waiting here | estou esperando aqui`}
                  className="mt-3 w-full resize-y rounded-[1.2rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-4 text-sm font-medium leading-relaxed text-text placeholder:text-text-subtle focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-[1rem] border border-border bg-[var(--color-surface-container-low)] p-4 sm:p-5 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-subtle">Destino</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => setImportMode('new')}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left transition-all ${ importMode === 'new' ? 'border-[var(--color-primary-light)] bg-surface-container-lowest text-primary shadow-sm' : 'border-border text-text-muted' }`}
                  >
                    <p className="text-sm font-black tracking-tight">Criar novo pack</p>
                    <p className="mt-1 text-xs font-medium opacity-70">Usa o nome e a descrição vindos do arquivo.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportMode('existing')
                      if (!selectedPackForImport && activePack) {
                        setSelectedPackForImport(activePack.id)
                      }
                    }}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left transition-all ${ importMode === 'existing' ? 'border-[var(--color-primary-light)] bg-surface-container-lowest text-primary shadow-sm' : 'border-border text-text-muted' }`}
                  >
                    <p className="text-sm font-black tracking-tight">Adicionar a pack existente</p>
                    <p className="mt-1 text-xs font-medium opacity-70">Remove vazios e duplicados antes de inserir.</p>
                  </button>
                </div>
              </div>

              {importMode === 'existing' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-text-subtle">Pack de destino</label>
                  <select
                    value={selectedPackForImport}
                    onChange={(e) => setSelectedPackForImport(e.target.value)}
                    className="mt-3 w-full rounded-[1.1rem] border border-border bg-surface-container-lowest px-4 py-3 text-sm font-bold text-text focus:border-primary focus:outline-none"
                  >
                    <option value="">Selecione um pack</option>
                    {packs.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name} ({pack.cards?.length || 0} cards)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {importMode === 'new' && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-subtle">Visibilidade</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => setImportPackVisibility('private')}
                      className={`rounded-[1.25rem] border px-4 py-4 text-left transition-all ${ importPackVisibility === 'private' ? 'border-[var(--color-primary-light)] bg-surface-container-lowest text-primary shadow-sm' : 'border-border text-text-muted' }`}
                    >
                      <p className="text-sm font-black tracking-tight">Adicionar privado</p>
                      <p className="mt-1 text-xs font-medium opacity-70">Só você verá este pack no Blitz e na biblioteca.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportPackVisibility('public')}
                      className={`rounded-[1.25rem] border px-4 py-4 text-left transition-all ${ importPackVisibility === 'public' ? 'border-[var(--color-primary-light)] bg-surface-container-lowest text-primary shadow-sm' : 'border-border text-text-muted' }`}
                    >
                      <p className="text-sm font-black tracking-tight">Adicionar para todos</p>
                      <p className="mt-1 text-xs font-medium opacity-70">Todos os membros poderão usar no Blitz.</p>
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 rounded-[1.25rem] border border-border bg-surface-container-lowest px-4 py-4 text-sm text-text">
                <input
                  type="checkbox"
                  checked={autoGenerateTts}
                  onChange={(e) => setAutoGenerateTts(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-[var(--color-primary)]"
                />
                <span>
                  <span className="block font-black tracking-tight">Gerar TTS após importar</span>
                  <span className="mt-1 block text-xs font-medium text-text-muted">
                    Usa a voz padrão configurada nesta tela para as novas frases.
                  </span>
                </span>
              </label>

              <div className="rounded-[1.25rem] border border-border bg-surface-container-lowest px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-subtle">Formatos aceitos</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['.apkg', '.json', '.csv', '.txt'].map((format) => (
                    <span
                      key={format}
                      className="rounded-full border border-border bg-[var(--color-surface-container-low)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-text-subtle"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {importError && (
            <div className="rounded-[1.5rem] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-4 text-sm font-bold text-[var(--color-error)]">
              {importError}
            </div>
          )}

          {importPreview && importAnalysis && (
            <div className="rounded-[1rem] border border-border bg-[var(--color-surface-container-low)] p-4 sm:p-5 space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pré-visualização</p>
                  <h4 className="mt-2 text-2xl font-black tracking-tight text-text">
                    {importMode === 'existing'
                      ? `Adicionar em ${selectedImportPack?.name || 'pack existente'}`
                      : importPreview.name}
                  </h4>
                  {importPreview.description && importMode === 'new' && (
                    <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-text-muted">
                      {importPreview.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-border bg-surface-container-lowest px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-text-subtle">
                    {importPreview.source}
                  </span>
                  <span className="rounded-full border border-[var(--color-primary-light)] bg-surface-container-lowest px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                    {importAnalysis.validCount} válidos
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[1.25rem] border border-border bg-surface-container-lowest px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">Entrada</p>
                  <p className="mt-2 text-2xl font-black text-text">{importAnalysis.totalInput}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--color-primary-light)] bg-surface-container-lowest px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Válidos</p>
                  <p className="mt-2 text-2xl font-black text-primary">{importAnalysis.validCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-surface-container-lowest px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">Duplicados</p>
                  <p className="mt-2 text-2xl font-black text-text">
                    {importAnalysis.duplicateWithinImportCount + importAnalysis.duplicateAgainstExistingCount}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-surface-container-lowest px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">Vazios</p>
                  <p className="mt-2 text-2xl font-black text-text">{importAnalysis.emptyCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-surface-container-lowest px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">Longos</p>
                  <p className="mt-2 text-2xl font-black text-text">{importAnalysis.longCardCount}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-surface-container-lowest p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-subtle">Amostra</p>
                    <p className="mt-1 text-sm font-medium text-text-muted">
                      Primeiros {Math.min(importAnalysis.validCards.length, 5)} cards válidos detectados.
                    </p>
                  </div>
                  <BookOpen className="w-5 h-5 text-text-subtle" strokeWidth={2.2} />
                </div>

                <div className="mt-4 grid gap-3">
                  {importAnalysis.validCards.slice(0, 5).map((card, index) => (
                    <div
                      key={`${card.en}-${card.pt}-${index}`}
                      className="grid gap-3 rounded-[1.2rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-4 md:grid-cols-2"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">English</p>
                        <p className="mt-1 text-sm font-bold leading-relaxed text-text">{card.en}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">Português</p>
                        <p className="mt-1 text-sm font-bold leading-relaxed text-text">{card.pt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={isPending || importLoading || importAnalysis.validCount === 0}
                  className="btn-primary px-8 !rounded-xl"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />}
                  {importMode === 'existing' ? 'Adicionar cards' : 'Criar pack importado'}
                </button>
                <button
                  type="button"
                  onClick={clearImportPreview}
                  disabled={isPending || importLoading}
                  className="btn-ghost px-8 !rounded-xl"
                >
                  Limpar prévia
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {showNewPack && (
        <form
          action={handleCreatePack}
          className="card space-y-5 p-4 sm:p-5 animate-slide-up"
        >
          <div>
            <p className="section-kicker">Novo conteúdo</p>
            <h3 className="mt-3 font-black text-2xl text-text">Novo pack</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nome do pack"
              required
              className="w-full rounded-xl border border-border bg-[var(--color-surface-container-low)] px-5 py-4 text-text font-bold placeholder:text-text-subtle focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all"
            />
            <select
              name="difficulty"
              className="w-full rounded-xl border border-border bg-[var(--color-surface-container-low)] px-5 py-4 text-text font-bold focus:bg-surface-container-lowest focus:border-primary focus:outline-none cursor-pointer appearance-none transition-all"
            >
              <option value="">Nível CEFR</option>
              <option value="A1">A1 — Iniciante</option>
              <option value="A2">A2 — Básico</option>
              <option value="B1">B1 — Intermediário</option>
              <option value="B2">B2 — Intermediário superior</option>
              <option value="C1">C1 — Avançado</option>
              <option value="C2">C2 — Proficiente</option>
            </select>
          </div>
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="w-full rounded-xl border border-border bg-[var(--color-surface-container-low)] px-5 py-4 text-text font-bold placeholder:text-text-subtle focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all"
          />
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Visibilidade do pack</legend>
            <label className="rounded-[1.25rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-4 text-text transition-all has-[:checked]:border-[var(--color-primary-light)] has-[:checked]:bg-surface-container-lowest">
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  className="mt-1 h-4 w-4 border-border text-primary focus:ring-[var(--color-primary)]"
                />
                <span>
                  <span className="block text-sm font-black tracking-tight">Adicionar privado</span>
                  <span className="mt-1 block text-xs font-medium text-text-muted">
                    Só você verá este pack no Blitz.
                  </span>
                </span>
              </span>
            </label>
            <label className="rounded-[1.25rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-4 text-text transition-all has-[:checked]:border-[var(--color-primary-light)] has-[:checked]:bg-surface-container-lowest">
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  defaultChecked
                  className="mt-1 h-4 w-4 border-border text-primary focus:ring-[var(--color-primary)]"
                />
                <span>
                  <span className="block text-sm font-black tracking-tight">Adicionar para todos</span>
                  <span className="mt-1 block text-xs font-medium text-text-muted">
                    Todos os membros poderão usar no Blitz.
                  </span>
                </span>
              </span>
            </label>
          </fieldset>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary px-8 !rounded-xl"
            >
              {isPending ? 'Salvando...' : 'Criar Pack'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewPack(false)}
              className="btn-ghost px-8 !rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <PackLibraryOrganizer
        packs={packs}
        selectedPackId={selectedPack}
        onSelectPack={(packId) => setSelectedPack((current) => (current === packId ? null : packId))}
        onRefresh={loadPacks}
      />

      {activePack && (
        <div
          ref={selectedPackDetailRef}
          className="card space-y-6 p-4 sm:p-5 lg:p-6 animate-slide-up"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-border">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-[0.85rem] bg-primary-light text-primary flex items-center justify-center border border-[var(--color-primary-light)]">
                <Package className="w-5 h-5" strokeWidth={2} />
              </div>
              {editingPack === activePack.id ? (
                <div className="flex-1 grid gap-3 w-full">
                  <input
                    value={packEditForm.name}
                    onChange={(e) => setPackEditForm({ ...packEditForm, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-[var(--color-surface-container-low)] px-4 py-2 font-bold text-text focus:bg-surface-container-lowest focus:outline-none"
                    placeholder="Nome do pack"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={packEditForm.description}
                      onChange={(e) => setPackEditForm({ ...packEditForm, description: e.target.value })}
                      placeholder="Descrição"
                      className="flex-1 rounded-xl border border-border bg-[var(--color-surface-container-low)] px-4 py-2 text-sm text-text focus:bg-surface-container-lowest focus:outline-none"
                    />
                    <select
                      value={packEditForm.level}
                      onChange={(e) => setPackEditForm({ ...packEditForm, level: e.target.value })}
                      className="w-full sm:w-auto rounded-xl border border-border bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-bold text-text focus:bg-surface-container-lowest focus:outline-none"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <h2 className="text-2xl font-black text-text truncate">
                    {activePack.name}
                  </h2>
                  <p className="text-sm font-bold text-text-subtle mt-1 uppercase tracking-widest">
                    {activePack.cards?.length || 0} cards · {activePack.level || 'Sem nível'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {editingPack === activePack.id ? (
                <>
                  <button onClick={() => handleUpdatePack(activePack.id)} className="btn-primary !rounded-xl px-6 py-2.5 text-sm">
                    Salvar
                  </button>
                  <button onClick={() => setEditingPack(null)} className="btn-ghost !rounded-xl px-6 py-2.5 text-sm">
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setShowRegenerateTts(activePack.id)} 
                    className="btn-ghost !rounded-xl px-4 py-2 text-primary hover:!bg-primary/5 border border-primary/20" 
                    title="Refazer todas as vozes do pack"
                  >
                    <Mic className="w-4 h-4 mr-2" strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-wider">Refazer Vozes</span>
                  </button>
	                  <button
	                    onClick={() => { setEditingPack(activePack.id); setPackEditForm({ name: activePack.name, description: activePack.description || '', level: activePack.level || 'B1' }); }}
	                    className="btn-ghost !rounded-xl p-3"
	                    aria-label={`Editar pack ${activePack.name}`}
	                  >
	                    <Edit2 className="w-4 h-4" strokeWidth={2.5} />
	                  </button>
	                  <button
	                    onClick={() => setPendingDeleteAction({ type: 'pack', id: activePack.id, name: activePack.name })}
	                    className="btn-ghost !rounded-xl p-3 text-[var(--color-error)] hover:!bg-[var(--color-error)]/5 hover:!border-[var(--color-error)]/10"
	                    aria-label={`Excluir pack ${activePack.name}`}
	                  >
	                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
	                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-low)] rounded-[1rem] p-4 sm:p-5 border border-border">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 px-1">Adicionar Frase</h4>
            <form action={handleCreateCard} className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <input type="hidden" name="pack_id" value={activePack.id} />
              <input name="en" placeholder="Inglês" required className="w-full rounded-xl border border-border bg-surface-container-lowest px-5 py-4 font-bold text-text placeholder:text-text-subtle focus:border-primary focus:outline-none transition-all shadow-sm" />
              <input name="pt" placeholder="Tradução" required className="w-full rounded-xl border border-border bg-surface-container-lowest px-5 py-4 font-bold text-text placeholder:text-text-subtle focus:border-primary focus:outline-none transition-all shadow-sm" />
              <input name="accepted_translations" placeholder="Sinônimos (separados por ;)" className="w-full rounded-xl border border-border bg-surface-container-lowest px-5 py-4 text-sm font-bold text-text-muted placeholder:text-text-subtle focus:border-primary focus:outline-none transition-all shadow-sm" />
              <button type="submit" disabled={isPending} className="btn-primary !rounded-xl px-10 py-4 lg:py-0 shadow-lg shadow-[var(--color-primary)]/10">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 sm:hidden" strokeWidth={3} /> <span className="hidden sm:inline-block"><Plus className="w-5 h-5" strokeWidth={3} /></span> <span className="sm:hidden font-bold ml-2">Adicionar</span></>}
              </button>
            </form>
          </div>

          <PackCardsOrganizer
            cards={activePack.cards || []}
            editingCardId={editingCard}
            editForm={editForm}
            onEditFormChange={setEditForm}
            onStartEdit={(card) => {
              setEditingCard(card.id)
              setEditForm({
                en: card.english_phrase || '',
                pt: card.portuguese_translation || '',
                acceptedTranslations: formatAcceptedTranslations(card.accepted_translations),
              })
            }}
            onCancelEdit={() => setEditingCard(null)}
            onSaveEdit={(cardId) => void handleUpdateCard(cardId)}
            onRegenerateTts={(cardId, phrase) => void regenerateSingleCardTts(cardId, phrase)}
            onDelete={(card) =>
              setPendingDeleteAction({
                type: 'card',
                id: card.id,
                name: card.english_phrase || card.en || 'card',
              })
            }
          />
        </div>
      )}
      {pendingDeleteAction && (
        <ConfirmDialog
          title={pendingDeleteAction.type === 'pack' ? 'Excluir pack' : 'Excluir card'}
          description={
            pendingDeleteAction.type === 'pack'
              ? `Isso apagará "${pendingDeleteAction.name}" e todos os cards do pack.`
              : `Excluir o card "${pendingDeleteAction.name}"?`
          }
          confirmLabel="Excluir"
          onCancel={() => setPendingDeleteAction(null)}
          onConfirm={() => {
            if (pendingDeleteAction.type === 'pack') {
              void handleDeletePack(pendingDeleteAction.id)
              return
            }
            void handleDeleteCard(pendingDeleteAction.id)
          }}
        />
      )}
    </div>
  )
}
