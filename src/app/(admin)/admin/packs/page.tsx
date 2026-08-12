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
import { groupPacksByFolder } from '@/features/cards/lib/packFolders'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import PacksHeader from './PacksHeader'
import {
  AdminBadge,
  accentBadge,
  fieldClass,
  fieldLabel,
  ghostBtn,
  glassTile,
  iconClass,
  innerPanelClass,
  modalShell,
  nestedCardClass,
  neutralBadge,
  primaryBtn,
  sectionDivider,
  adminPacksChoiceCard,
  adminPacksChoiceCardActive,
  adminPacksChoiceCardIdle,
  adminPacksImportDropzone,
  adminPacksPanel,
  adminPacksShell,
  adminPacksTelemetryBand,
  adminPacksTelemetryCell,
} from '@/features/admin/lib/adminPacksUi'
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
  Play,
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

  const publicPackCount = packs.filter((pack) => pack.is_public).length
  const folderCount = groupPacksByFolder(packs).length
  const audioHealth = totalCards > 0 ? Math.round(((totalCards - missingAudioCount) / totalCards) * 100) : 100

  const telemetry = [
    { label: 'Packs', value: String(packs.length), icon: Package },
    { label: 'Cards', value: totalCards.toLocaleString(), icon: BookOpen },
    { label: 'Pastas', value: String(folderCount), icon: Package },
    { label: 'Públicos', value: String(publicPackCount), icon: BookOpen },
    { label: 'Sem áudio', value: String(missingAudioCount), icon: Mic },
    { label: 'Áudio OK', value: `${audioHealth}%`, icon: Mic },
  ]

  return (
    <div className={adminPacksShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-8 animate-fade-in sm:space-y-8">
        <AdminMotionSection>
          <PacksHeader
            packCount={packs.length}
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={handleToggleImportPanel} className={ghostBtn}>
                  {showImport ? 'Fechar importação' : 'Importar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPack(!showNewPack)}
                  data-testid="open-new-pack"
                  className={primaryBtn}
                >
                  {showNewPack ? 'Fechar novo pack' : 'Criar pack'}
                </button>
              </div>
            }
          />
        </AdminMotionSection>

        <AdminMotionSection className={adminPacksTelemetryBand} stagger>
          {telemetry.map((item) => {
            const Icon = item.icon
            return (
              <AdminMotionItem key={item.label}>
                <div className={adminPacksTelemetryCell}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                      {item.label}
                    </p>
                    <Icon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.2} aria-hidden />
                  </div>
                  <p className="font-heading text-lg font-bold leading-none text-brand-dark sm:text-xl">{item.value}</p>
                </div>
              </AdminMotionItem>
            )
          })}
        </AdminMotionSection>

        <AdminMotionSection>
          <div className={`${adminPacksPanel} p-4 sm:p-5`}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-heading text-lg font-bold text-brand-dark">Voz Padrão (TTS)</h3>
            <p className="mt-1 font-body text-xs font-medium text-brand-secondary">
              Usada para gerar os áudios das novas frases.
            </p>
          </div>
          <div className={`${nestedCardClass} flex items-center gap-2 px-3 py-2`}>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="min-w-[200px] cursor-pointer bg-transparent font-body text-sm font-semibold text-brand-dark focus:outline-none"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handlePreviewVoice}
              disabled={previewingVoice}
              aria-label="Pré-visualizar voz"
              className={`rounded-lg border-2 border-brand-dark p-2 transition-colors ${
                previewingVoice
                  ? 'bg-bg-primary text-brand-secondary'
                  : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
              }`}
            >
              {previewingVoice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {missingAudioCount > 0 && (
          <div className={`${innerPanelClass} mt-5`}>
            <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <h3 className="font-heading text-sm font-bold text-brand-dark">Áudios pendentes</h3>
                <p className="mt-1 max-w-xl font-body text-sm text-brand-secondary">
                  Existem <strong className="text-brand-dark">{missingAudioCount} frases</strong> sem
                  pronúncia. Gere usando a voz{' '}
                  <strong className="text-brand-dark">
                    {VOICES.find((v) => v.id === selectedVoice)?.name}
                  </strong>
                  .
                </p>
              </div>
              <button
                onClick={generateAllMissingTts}
                disabled={ttsState?.active}
                className={primaryBtn}
              >
                Gerar áudios
              </button>
            </div>
          </div>
        )}
          </div>
        </AdminMotionSection>

        {actionError && (
          <AdminMotionSection>
            <div className="flex items-center gap-3 rounded-[13px] border border-brand-dark bg-bg-primary px-4 py-3 font-body text-sm font-bold text-brand-dark">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {actionError}
            </div>
          </AdminMotionSection>
        )}

        {ttsState?.active && (
          <ModalPortal
            closeOnBackdrop={false}
            className="fixed inset-0 z-[99999] flex min-h-[100dvh] items-center justify-center overflow-y-auto overscroll-contain bg-brand-dark/15 p-4 backdrop-blur-2xl"
          >
            <div className={`${modalShell} mx-4 flex w-full max-w-sm flex-col items-center p-6 text-center`}>
              <Loader2 className="mb-4 h-6 w-6 animate-spin text-brand-dark" strokeWidth={2} />
              <h3 className="mb-2 font-heading text-lg font-bold text-brand-dark">Processando áudio</h3>
              <p className="mb-6 font-body text-sm text-brand-secondary">
                Gerando narrações neurais. Mantenha esta aba aberta.
              </p>
              {ttsState.currentPhrase && (
                <div className={`${innerPanelClass} mb-6 w-full`}>
                  <p className={fieldLabel}>Frase atual</p>
                  <p className="mt-2 line-clamp-2 font-body text-sm font-semibold leading-relaxed text-brand-dark">
                    &quot;{ttsState.currentPhrase}&quot;
                  </p>
                </div>
              )}
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full border-2 border-brand-dark bg-bg-primary">
                <div
                  className="h-full rounded-full bg-brand-accent transition-all duration-500"
                  style={{ width: `${(ttsState.currentCount / ttsState.totalCount) * 100}%` }}
                />
              </div>
              <p className="font-body text-sm font-semibold text-brand-secondary">
                {ttsState.currentCount} / {ttsState.totalCount}
              </p>
            </div>
          </ModalPortal>
        )}

        {showRegenerateTts && (
          <ModalPortal
            onClose={() => setShowRegenerateTts(null)}
            className="fixed inset-0 z-[99998] flex min-h-[100dvh] items-center justify-center overflow-y-auto overscroll-contain bg-brand-dark/15 p-4 backdrop-blur-2xl"
          >
            <div
              ref={regenerateModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="regenerate-tts-title"
              className={`${modalShell} max-w-md p-6 animate-scale-in`}
            >
              <AdminBadge label="TTS" />
              <h3 id="regenerate-tts-title" className="mt-4 font-heading text-lg font-bold text-brand-dark">
                Refazer vozes
              </h3>
              <p className="mb-6 mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                Isso irá recriar os áudios de{' '}
                <strong className="text-brand-dark">todas as frases</strong> deste pacote, substituindo
                os antigos. Escolha a voz que deseja usar.
              </p>

              <div className="mb-8 space-y-4">
                <div>
                  <label className={fieldLabel}>Selecione a Voz</label>
                  <div className={`${nestedCardClass} mt-2 flex items-center gap-2 px-4 py-2`}>
                    <select
                      value={regenerateVoice}
                      onChange={(e) => setRegenerateVoice(e.target.value)}
                      className="w-full cursor-pointer bg-transparent font-body text-sm font-semibold text-brand-dark focus:outline-none"
                    >
                      {VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={(e) => handlePreviewVoice(e, regenerateVoice)}
                      disabled={previewingVoice}
                      aria-label="Pré-visualizar voz"
                      className={`rounded-lg border-2 border-brand-dark p-2 transition-all ${
                        previewingVoice
                          ? 'bg-bg-primary text-brand-secondary'
                          : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
                      }`}
                    >
                      {previewingVoice ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => regenerateAllTtsForPack(showRegenerateTts)}
                  className={`${primaryBtn} flex-1 py-3`}
                >
                  <Mic className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> Iniciar
                </button>
                <button onClick={() => setShowRegenerateTts(null)} className={`${ghostBtn} flex-1 py-3`}>
                  Cancelar
                </button>
              </div>
            </div>
          </ModalPortal>
        )}

        {showImport && (
          <AdminMotionSection>
            <div className={`${adminPacksPanel} space-y-5 p-4 sm:p-5 animate-slide-up`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <AdminBadge label="Importação" />
              <h3 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Importar pack</h3>
              <p className="mt-1 max-w-2xl font-body text-sm font-medium text-brand-secondary">
                Selecione um arquivo `.apkg`, `.json`, `.csv` ou `.txt`, ou cole linhas no formato
                ` inglês | tradução `, ` inglês, tradução ` ou separadas por tabulação.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className={primaryBtn}
              >
                {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" strokeWidth={2.5} />}
                Selecionar arquivo
              </button>
              <button
                type="button"
                onClick={handleTextImport}
                disabled={importLoading}
                className={ghostBtn}
              >
                <FileText className="h-4 w-4" strokeWidth={2.5} />
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
            <div className={`${innerPanelClass} sm:p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={accentBadge}>Fonte</span>
                  <h4 className="mt-3 font-heading text-lg font-bold tracking-tight text-brand-dark">
                    Arquivo ou texto bruto
                  </h4>
                </div>
                <span className={accentBadge}>APKG pronto</span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className={`${adminPacksImportDropzone} mt-5`}
              >
                {importLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" strokeWidth={2.5} />}
                {importLoading ? 'Processando arquivo...' : 'Escolher .apkg, .json, .csv ou .txt'}
              </button>

              <div className={`${nestedCardClass} mt-5 p-4`}>
                <p className={fieldLabel}>Colar conteúdo</p>
                <textarea
                  ref={textareaRef}
                  rows={8}
                  placeholder={`hello there | olá\nI am waiting here | estou esperando aqui`}
                  className={`${fieldClass} mt-3 resize-y`}
                />
              </div>
            </div>

            <div className={`${innerPanelClass} space-y-4 sm:p-5`}>
              <div>
                <p className={fieldLabel}>Destino</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => setImportMode('new')}
                    className={`${adminPacksChoiceCard} ${
                      importMode === 'new' ? adminPacksChoiceCardActive : adminPacksChoiceCardIdle
                    }`}
                  >
                    <p className="font-body text-sm font-bold tracking-tight">Criar novo pack</p>
                    <p className="mt-1 font-body text-xs font-medium opacity-70">
                      Usa o nome e a descrição vindos do arquivo.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportMode('existing')
                      if (!selectedPackForImport && activePack) {
                        setSelectedPackForImport(activePack.id)
                      }
                    }}
                    className={`${adminPacksChoiceCard} ${
                      importMode === 'existing' ? adminPacksChoiceCardActive : adminPacksChoiceCardIdle
                    }`}
                  >
                    <p className="font-body text-sm font-bold tracking-tight">Adicionar a pack existente</p>
                    <p className="mt-1 font-body text-xs font-medium opacity-70">
                      Remove vazios e duplicados antes de inserir.
                    </p>
                  </button>
                </div>
              </div>

              {importMode === 'existing' && (
                <div>
                  <label className={fieldLabel}>Pack de destino</label>
                  <select
                    value={selectedPackForImport}
                    onChange={(e) => setSelectedPackForImport(e.target.value)}
                    className={`${fieldClass} mt-3 cursor-pointer`}
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
                  <p className={fieldLabel}>Visibilidade</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => setImportPackVisibility('private')}
                      className={`${adminPacksChoiceCard} ${
                        importPackVisibility === 'private' ? adminPacksChoiceCardActive : adminPacksChoiceCardIdle
                      }`}
                    >
                      <p className="font-body text-sm font-bold tracking-tight">Adicionar privado</p>
                      <p className="mt-1 font-body text-xs font-medium opacity-70">
                        Só você verá este pack no Blitz e na biblioteca.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportPackVisibility('public')}
                      className={`${adminPacksChoiceCard} ${
                        importPackVisibility === 'public' ? adminPacksChoiceCardActive : adminPacksChoiceCardIdle
                      }`}
                    >
                      <p className="font-body text-sm font-bold tracking-tight">Adicionar para todos</p>
                      <p className="mt-1 font-body text-xs font-medium opacity-70">
                        Todos os membros poderão usar no Blitz.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <label className={`${nestedCardClass} flex items-start gap-3 px-4 py-4 font-body text-sm text-brand-dark`}>
                <input
                  type="checkbox"
                  checked={autoGenerateTts}
                  onChange={(e) => setAutoGenerateTts(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-2 border-brand-dark text-brand-dark focus:ring-brand-accent/40"
                />
                <span>
                  <span className="block font-bold tracking-tight">Gerar TTS após importar</span>
                  <span className="mt-1 block text-xs font-medium text-brand-secondary">
                    Usa a voz padrão configurada nesta tela para as novas frases.
                  </span>
                </span>
              </label>

              <div className={`${nestedCardClass} px-4 py-4`}>
                <p className={fieldLabel}>Formatos aceitos</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['.apkg', '.json', '.csv', '.txt'].map((format) => (
                    <span key={format} className={neutralBadge}>
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {importError && (
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary px-5 py-4 font-body text-sm font-bold text-brand-dark">
              {importError}
            </div>
          )}

          {importPreview && importAnalysis && (
            <div className={`${innerPanelClass} space-y-5 sm:p-5`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className={accentBadge}>Pré-visualização</span>
                  <h4 className="mt-3 font-heading text-2xl font-bold tracking-tight text-brand-dark">
                    {importMode === 'existing'
                      ? `Adicionar em ${selectedImportPack?.name || 'pack existente'}`
                      : importPreview.name}
                  </h4>
                  {importPreview.description && importMode === 'new' && (
                    <p className="mt-2 max-w-3xl font-body text-sm font-medium leading-relaxed text-brand-secondary">
                      {importPreview.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={neutralBadge}>{importPreview.source}</span>
                  <span className={accentBadge}>{importAnalysis.validCount} válidos</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className={`${nestedCardClass} px-4 py-4`}>
                  <p className={fieldLabel}>Entrada</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-brand-dark">{importAnalysis.totalInput}</p>
                </div>
                <div className={`${nestedCardClass} border-brand-accent px-4 py-4`}>
                  <p className={accentBadge}>Válidos</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-brand-dark">{importAnalysis.validCount}</p>
                </div>
                <div className={`${nestedCardClass} px-4 py-4`}>
                  <p className={fieldLabel}>Duplicados</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-brand-dark">
                    {importAnalysis.duplicateWithinImportCount + importAnalysis.duplicateAgainstExistingCount}
                  </p>
                </div>
                <div className={`${nestedCardClass} px-4 py-4`}>
                  <p className={fieldLabel}>Vazios</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-brand-dark">{importAnalysis.emptyCount}</p>
                </div>
                <div className={`${nestedCardClass} px-4 py-4`}>
                  <p className={fieldLabel}>Longos</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-brand-dark">{importAnalysis.longCardCount}</p>
                </div>
              </div>

              <div className={`${nestedCardClass} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={fieldLabel}>Amostra</p>
                    <p className="mt-1 font-body text-sm font-medium text-brand-secondary">
                      Primeiros {Math.min(importAnalysis.validCards.length, 5)} cards válidos detectados.
                    </p>
                  </div>
                  <BookOpen className="h-5 w-5 text-brand-secondary" strokeWidth={2.2} />
                </div>

                <div className="mt-4 grid gap-3">
                  {importAnalysis.validCards.slice(0, 5).map((card, index) => (
                    <div
                      key={`${card.en}-${card.pt}-${index}`}
                      className={`${innerPanelClass} grid gap-3 md:grid-cols-2`}
                    >
                      <div>
                        <p className={fieldLabel}>English</p>
                        <p className="mt-1 font-body text-sm font-semibold leading-relaxed text-brand-dark">
                          {card.en}
                        </p>
                      </div>
                      <div>
                        <p className={fieldLabel}>Português</p>
                        <p className="mt-1 font-body text-sm font-semibold leading-relaxed text-brand-dark">
                          {card.pt}
                        </p>
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
                  className={primaryBtn}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                  )}
                  {importMode === 'existing' ? 'Adicionar cards' : 'Criar pack importado'}
                </button>
                <button
                  type="button"
                  onClick={clearImportPreview}
                  disabled={isPending || importLoading}
                  className={ghostBtn}
                >
                  Limpar prévia
                </button>
              </div>
            </div>
          )}
            </div>
          </AdminMotionSection>
        )}

        {showNewPack && (
          <AdminMotionSection>
            <form action={handleCreatePack} className={`${glassTile} space-y-5 p-4 sm:p-5 animate-slide-up`}>
          <div>
            <AdminBadge label="Novo conteúdo" />
            <h3 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Novo pack</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" placeholder="Nome do pack" required className={fieldClass} />
            <select name="difficulty" className={`${fieldClass} cursor-pointer appearance-none`}>
              <option value="">Nível CEFR</option>
              <option value="A1">A1 — Iniciante</option>
              <option value="A2">A2 — Básico</option>
              <option value="B1">B1 — Intermediário</option>
              <option value="B2">B2 — Intermediário superior</option>
              <option value="C1">C1 — Avançado</option>
              <option value="C2">C2 — Proficiente</option>
            </select>
          </div>
          <input name="description" placeholder="Descrição (opcional)" className={fieldClass} />
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Visibilidade do pack</legend>
            <label className={`${nestedCardClass} px-4 py-4 text-brand-dark transition-all has-[:checked]:border-brand-accent has-[:checked]:bg-brand-accent/20`}>
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  className="mt-1 h-4 w-4 border-2 border-brand-dark text-brand-dark focus:ring-brand-accent/40"
                />
                <span>
                  <span className="block font-body text-sm font-bold tracking-tight">Adicionar privado</span>
                  <span className="mt-1 block font-body text-xs font-medium text-brand-secondary">
                    Só você verá este pack no Blitz.
                  </span>
                </span>
              </span>
            </label>
            <label className={`${nestedCardClass} px-4 py-4 text-brand-dark transition-all has-[:checked]:border-brand-accent has-[:checked]:bg-brand-accent/20`}>
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  defaultChecked
                  className="mt-1 h-4 w-4 border-2 border-brand-dark text-brand-dark focus:ring-brand-accent/40"
                />
                <span>
                  <span className="block font-body text-sm font-bold tracking-tight">Adicionar para todos</span>
                  <span className="mt-1 block font-body text-xs font-medium text-brand-secondary">
                    Todos os membros poderão usar no Blitz.
                  </span>
                </span>
              </span>
            </label>
          </fieldset>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className={primaryBtn}>
              {isPending ? 'Salvando...' : 'Criar Pack'}
            </button>
            <button type="button" onClick={() => setShowNewPack(false)} className={ghostBtn}>
              Cancelar
            </button>
          </div>
            </form>
          </AdminMotionSection>
        )}

        <AdminMotionSection>
          <PackLibraryOrganizer
        packs={packs}
        selectedPackId={selectedPack}
        onSelectPack={(packId) => setSelectedPack((current) => (current === packId ? null : packId))}
        onRefresh={loadPacks}
          />
        </AdminMotionSection>

        {activePack && (
          <AdminMotionSection>
            <div ref={selectedPackDetailRef}>
            <div className={`${adminPacksPanel} space-y-6 p-4 sm:p-5 lg:p-6 animate-slide-up`}>
          <div className={`flex flex-col items-start justify-between gap-5 pb-5 sm:flex-row sm:items-center ${sectionDivider}`}>
            <div className="flex flex-1 items-center gap-4">
              <div className={iconClass}>
                <Package className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              </div>
              {editingPack === activePack.id ? (
                <div className="grid w-full flex-1 gap-3">
                  <input
                    value={packEditForm.name}
                    onChange={(e) => setPackEditForm({ ...packEditForm, name: e.target.value })}
                    className={fieldClass}
                    placeholder="Nome do pack"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={packEditForm.description}
                      onChange={(e) => setPackEditForm({ ...packEditForm, description: e.target.value })}
                      placeholder="Descrição"
                      className={`${fieldClass} flex-1`}
                    />
                    <select
                      value={packEditForm.level}
                      onChange={(e) => setPackEditForm({ ...packEditForm, level: e.target.value })}
                      className={`${fieldClass} w-full cursor-pointer sm:w-auto`}
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
                  <h2 className="truncate font-heading text-2xl font-bold text-brand-dark">
                    {activePack.name}
                  </h2>
                  <p className="mt-1 font-body text-sm font-bold uppercase tracking-widest text-brand-secondary">
                    {activePack.cards?.length || 0} cards · {activePack.level || 'Sem nível'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {editingPack === activePack.id ? (
                <>
                  <button onClick={() => handleUpdatePack(activePack.id)} className={primaryBtn}>
                    Salvar
                  </button>
                  <button onClick={() => setEditingPack(null)} className={ghostBtn}>
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRegenerateTts(activePack.id)}
                    className={ghostBtn}
                    title="Refazer todas as vozes do pack"
                  >
                    <Mic className="mr-2 h-4 w-4" strokeWidth={2.5} />
                    <span className="font-body text-xs font-bold uppercase tracking-wider">Refazer Vozes</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingPack(activePack.id)
                      setPackEditForm({
                        name: activePack.name,
                        description: activePack.description || '',
                        level: activePack.level || 'B1',
                      })
                    }}
                    className={ghostBtn}
                    aria-label={`Editar pack ${activePack.name}`}
                  >
                    <Edit2 className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() =>
                      setPendingDeleteAction({ type: 'pack', id: activePack.id, name: activePack.name })
                    }
                    className={ghostBtn}
                    aria-label={`Excluir pack ${activePack.name}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={innerPanelClass}>
            <span className={`${accentBadge} mb-6 inline-flex`}>Adicionar Frase</span>
            <form action={handleCreateCard} className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <input type="hidden" name="pack_id" value={activePack.id} />
              <input name="en" placeholder="Inglês" required className={fieldClass} />
              <input name="pt" placeholder="Tradução" required className={fieldClass} />
              <input
                name="accepted_translations"
                placeholder="Sinônimos (separados por ;)"
                className={fieldClass}
              />
              <button type="submit" disabled={isPending} className={`${primaryBtn} px-10 py-4 lg:py-0`}>
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 sm:hidden" strokeWidth={3} />
                    <span className="hidden sm:inline-block">
                      <Plus className="h-5 w-5" strokeWidth={3} />
                    </span>
                    <span className="ml-2 font-bold sm:hidden">Adicionar</span>
                  </>
                )}
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
            </div>
          </AdminMotionSection>
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
    </div>
  )
}
